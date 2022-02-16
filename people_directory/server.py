"""
Server for people directory
"""

from datetime import datetime, timedelta
from functools import partial
import json
import logging
import re
import os

from tornado.web import RequestHandler, HTTPError
from tornado.escape import xhtml_escape
from rest_tools.server import RestServer, from_environment

from .people import People


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
    def initialize(self, people):
        self.people = people

    async def get(self, *args):
        # escape data, just in case
        insts = escape_json(self.people.institutions.values(), 'group_path')
        users = escape_json(self.people.users.values(), 'username')
        for u in users.values():
            if 'institution' not in u:
                logging.info(f'{u}')
        self.render('index.html', json=json, insts=insts, users=users)

class Health(RequestHandler):
    def initialize(self, people):
        self.people = people

    async def get(self):
        self.write({
            'now': datetime.utcnow().isoformat(),
            'last_update': self.people.last_update.isoformat() if self.people.last_update else 'None',
        })
        if (not self.people.last_update) or datetime.utcnow() - self.people.last_update > timedelta(hours=1):
            self.set_status(400)

def create_server():
    static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

    default_config = {
        'HOST': 'localhost',
        'PORT': 8080,
        'DEBUG': False,
        'EXPERIMENT': 'IceCube',
    }
    config = from_environment(default_config)

    rest_config = {
        'debug': config['DEBUG'],
    }

    kwargs = {}
    kwargs['people'] = People(config['EXPERIMENT'])

    server = RestServer(static_path=static_path, template_path=static_path, debug=config['DEBUG'])

    server.add_route('/healthz', Health, kwargs)
    server.add_route(r'/(.*)', Main, kwargs)

    server.startup(address=config['HOST'], port=config['PORT'])

    return server
