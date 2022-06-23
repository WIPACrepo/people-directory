import asyncio
from collections import defaultdict
from datetime import datetime
from functools import partial
import logging

import krs.token
import krs.groups
import krs.institutions
import krs.users


USER_DETAILS = ['firstName', 'lastName', 'email', 'username']
USER_ATTRS = ['mobile']


class People:
    """Cache for Keycloak user info"""
    def __init__(self, experiment):
        self.experiment = experiment
        self.institutions = {}
        self.users = {}
        self.last_update = None

        self.krs_client = krs.token.get_rest_client()

        loop = asyncio.get_event_loop()
        loop.call_soon(partial(asyncio.create_task, self.update()))

    async def update(self):
        """Get data from Keycloak"""
        logging.info('People.update()')
        insts = await krs.institutions.list_insts(self.experiment, rest_client=self.krs_client)

        users = defaultdict(dict)
        for group_path in sorted(insts):
            logging.debug(f'updating inst {group_path}')
            inst = insts[group_path]
            inst['group_path'] = group_path

            if 'name' not in inst or 'cite' not in inst:
                logging.info(f'bad inst: {group_path}')
                del insts[group_path]
                continue

            # get active users
            ret = await krs.groups.get_group_membership(group_path, rest_client=self.krs_client)
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
        for username in sorted(users):
            if 'institutions' not in users[username]:
                logging.info(f'user not in any institution, so dropping: {username}')
                del users[username]
                continue
            logging.debug(f'updating user {username}')
            ret = await krs.users.user_info(username, rest_client=self.krs_client)
            if ret.get('firstName', '') == '' or ret.get('lastName', '') == '':
                del users[username]
                continue
            for k in USER_DETAILS:
                users[username][k] = ret.get(k, '')
            for k in USER_ATTRS:
                users[username][k] = ret['attributes'].get(k, '')

        # update state
        self.institutions = insts
        self.users = users
        self.last_update = datetime.utcnow()
        logging.info('done with update()')

        # call again
        loop = asyncio.get_event_loop()
        loop.call_later(600, partial(asyncio.create_task, self.update()))
