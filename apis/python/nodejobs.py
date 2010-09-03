# -*- coding: utf-8 -*-
import datetime, httplib, urllib, simplejson

JOB_STATUS_STANDING = 'standing'
JOB_STATUS_ASSIGNED = 'assigned'
JOB_STATUS_DONE = 'done'
JOB_STATUS_DISCARTED = 'discarted'
JOB_STATUS_EXPIRED = 'expired'
JOB_STATUS_FAILED = 'failed'

class Connection(object):
    # Store for singleton instance
    _singleton = None

    def __new__(cls, *args, **kwargs):
        if not cls._singleton:
            cls._singleton = object.__new__(cls)

        return cls._singleton

    def __init__(self, host='localhost', port=3000, default_sender=None, user=None, password=None):
        self.host = host
        self.port = port
        self.default_sender = default_sender

    def _get_connection(self):
        return httplib.HTTPConnection(self.host, int(self.port))

    def _encode_params(self, params):
        return urllib.urlencode(dict([(k,v) for k,v in params.items() if v is not None]))

    def _get(self, url, params=None):
        params['exclude_ids'] = ','.join(params.get('exclude_ids', []))

        if params.get('params', None):
            params['params'] = self._encode_json(params['params'])

        conn = self._get_connection()
        conn.request('GET', '%s?%s'%(url, params and self._encode_params(params) or ''))

        resp = conn.getresponse()

        return resp.read()

    def _post(self, url, params):
        conn = self._get_connection()
        conn.request('POST', url, params and self._encode_params(params) or '')

        resp = conn.getresponse()

        return resp.read()

    def _put(self, url, params):
        conn = self._get_connection()
        conn.request('PUT', url, params and self._encode_params(params) or '')

        resp = conn.getresponse()

        return resp.read()

    def _encode_json(self, data):
        return JSONEncoder().encode(data)
   
    def _decode_response(self, data):
        return simplejson.loads(data)
     
    def remove_all_jobs(self):
        return unicode(self._get('/jobs/delete/', {'_all': True}))

    def post_job(self, name, params, sender=None, destinatary=None, expire=None, key=None):
        now = datetime.datetime.now()

        obj = {
            'key': key,
            'name': name,
            'params': params,
            'sender': sender or self.default_sender,
            'destinatary': destinatary,
            'when': now,
            'status': JOB_STATUS_STANDING,
            'expire': expire,
            'assigned_by': None,
            'response_message': None,
            }

        ret = unicode(self._get('/jobs/post/', obj))
        return self._decode_response(ret)

    def get_jobs(self, **kwargs):
        ret = unicode(self._get('/jobs/', kwargs))
        return self._decode_response(ret)

    def get_next_job(self, **kwargs):
        kwargs.setdefault('status', JOB_STATUS_STANDING)
        ret = unicode(self._get('/jobs/next/', kwargs))
        return self._decode_response(ret)

    def delete_job(self, msg_id=None, key=None, status=None):
        if key is not None:
            where = {'key': key}
        else:
            if isinstance(msg_id, basestring):
                msg_id = pymongo.objectid.ObjectId(msg_id)
            where = {'_id': msg_id}

        if status:
            where['status'] = status

        ret = unicode(self._get('/jobs/delete/', where))
        return self._decode_response(ret)

    def expire_jobs(self):
        ret = unicode(self._get('/jobs/expire/'))
        return self._decode_response(ret)
    
    def update_job(self, msg_id, **fields):
        ret = unicode(self._get('/jobs/%s/update/'%msg_id, fields))
        return self._decode_response(ret)

class JSONEncoder(simplejson.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.strftime('%Y-%m-%d %H:%M:%S')
        else:
            return simplejson.JSONEncoder.default(self, obj)

