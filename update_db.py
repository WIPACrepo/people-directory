import asyncio
from collections import defaultdict
from functools import partial
import logging

import krs.token
import krs.groups
import krs.institutions
import krs.users
import motor.motor_asyncio
from rest_tools.client import RestClient
from rest_tools.server import from_environment


setlevel = {
    'CRITICAL': logging.CRITICAL,  # execution cannot continue
    'FATAL': logging.CRITICAL,
    'ERROR': logging.ERROR,  # something is wrong, but try to continue
    'WARNING': logging.WARNING,  # non-ideal behavior, important event
    'WARN': logging.WARNING,
    'INFO': logging.INFO,  # initial debug information
    'DEBUG': logging.DEBUG  # the things no one wants to see
}

USER_DETAILS = ['firstName', 'lastName', 'email', 'username']
USER_ATTRS = ['mobile']

async def run(experiment, client, db_name, krs_client):
    """Get data from Keycloak and update DB."""
    insts = await krs.institutions.list_insts(experiment, rest_client=krs_client)

    users = defaultdict(dict)
    for group_path in insts:
        inst = insts[group_path]
        inst['group_path'] = group_path

        if 'name' not in inst or 'cite' not in inst:
            logging.info(f'bad inst: {group_path}')
            continue

        # get active users
        ret = await krs.groups.get_group_membership(group_path, rest_client=krs_client)
        inst['members'] = ret
        for user in ret:
            if 'institutions' not in users[user]:
                users[user]['institutions'] = [group_path]
            else:
                users[user]['institutions'].append(group_path)

        # mark IL
        if 'institutionLeadUid' in inst:
            il_uid = inst['institutionLeadUid']
            if isinstance(il_uid, list):
                for uid in il_uid:
                    if uid in ret:
                        users[uid]['IL'] = group_path

            elif il_uid in ret:
                users[il_uid]['IL'] = group_path

    # get user details
    for username in list(users):
        ret = await krs.users.user_info(username, rest_client=krs_client)
        if ret.get('firstName', '') == '' or ret.get('lastName', '') == '':
            del users[username]
        for k in USER_DETAILS:
            users[username][k] = ret.get(k, '')
        for k in USER_ATTRS:
            users[username][k] = ret['attributes'].get(k, '')

    # update db
    db = client[db_name]
    indexes = [index['name'] async for index in db.insts.list_indexes()]
    if 'username' not in indexes:
        await db.users.create_index('username', background=True, unique=True, name='username')
    indexes = [index['name'] async for index in db.insts.list_indexes()]
    if 'name' not in indexes:
        await db.insts.create_index('name', background=True, unique=True, name='name')
    if 'username' not in indexes:
        await db.insts.create_index('username', background=True, name='username')

    async with await client.start_session() as s:
        async with s.start_transaction():
            await db.users.delete_many({}, session=s)
            await db.users.insert_many(users.values(), session=s)
            await db.insts.delete_many({}, session=s)
            await db.insts.insert_many(insts.values(), session=s)

async def main():
    # handle logging
    default_config = {
        'LOG_LEVEL': 'INFO',
        'EXPERIMENT': 'IceCube',
        'KEYCLOAK_URL': None,
        'KEYCLOAK_REALM': 'IceCube',
        'KEYCLOAK_CLIENT_ID': None,
        'KEYCLOAK_CLIENT_SECRET': None,
        'DB_URL': 'mongodb://localhost/people_directory',
    }
    config = from_environment(default_config)
    if config['LOG_LEVEL'].upper() not in setlevel:
        raise Exception('LOG_LEVEL is not a proper log level')
    logformat = '%(asctime)s %(levelname)s %(name)s %(module)s:%(lineno)s - %(message)s'

    logging.basicConfig(format=logformat, level=setlevel[config['LOG_LEVEL'].upper()])

    # prepare args for run
    kwargs = {'experiment': config['EXPERIMENT']}

    logging.info(f'DB: {config["DB_URL"]}')
    db_url, db_name = config['DB_URL'].rsplit('/', 1)
    db = motor.motor_asyncio.AsyncIOMotorClient(db_url)
    logging.info(f'DB name: {db_name}')
    kwargs['client'] = db
    kwargs['db_name'] = db_name

    logging.info(f'Keycloak client: {config["KEYCLOAK_CLIENT_ID"]}')
    kwargs['krs_client'] = krs.token.get_rest_client()

    await run(**kwargs)

if __name__ == '__main__':
    asyncio.run(main())
