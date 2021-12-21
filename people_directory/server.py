"""
Server for people directory
"""

from functools import partial
import json
import logging
import re
import os

from tornado.web import RequestHandler, HTTPError
from tornado.escape import xhtml_escape
from rest_tools.client import RestClient
from rest_tools.server import RestServer, from_environment
import motor.motor_asyncio

import krs.token

CLEANR = re.compile('<.*?>')
def recursive_escape(data):
    if isinstance(data, dict):
        return {recursive_escape(k): recursive_escape(v) for k,v in data.items()}
    elif isinstance(data, list):
        return [recursive_escape(v) for v in data]
    else:
        return re.sub(CLEANR, '', data)

def escape_json(data, key=None):
    ret = {} if key else []
    for item in data:
        if key and key not in item:
            continue
        item = recursive_escape(item)
        if key:
            ret[item[key]] = item
        else:
            ret.append(val)
    return ret

class Main(RequestHandler):
    def initialize(self, db):
        self.db = db

    async def get(self, *args):
        # escape data, just in case
        ret = await self.db.insts.find(projection={'_id': False}).to_list(100000)
        insts = escape_json(ret, 'group_path')
        logging.info(f'{insts}')
        ret = await self.db.users.find(projection={'_id': False}).to_list(100000)
        users = escape_json(ret, 'username')
        self.render('index.html', json=json, insts=insts, users=users)

def create_server():
    static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

    default_config = {
        'HOST': 'localhost',
        'PORT': 8080,
        'DEBUG': False,
        'DB_URL': 'mongodb://localhost/people_directory',
    }
    config = from_environment(default_config)

    rest_config = {
        'debug': config['DEBUG'],
    }

    kwargs = {}

    logging.info(f'DB: {config["DB_URL"]}')
    db_url, db_name = config['DB_URL'].rsplit('/', 1)
    db = motor.motor_asyncio.AsyncIOMotorClient(db_url)
    logging.info(f'DB name: {db_name}')
    kwargs['db'] = db[db_name]

    server = RestServer(static_path=static_path, template_path=static_path, debug=config['DEBUG'])

    server.add_route(r'/(.*)', Main, kwargs)

    server.startup(address=config['HOST'], port=config['PORT'])

    return server
