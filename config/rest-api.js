'use strict';

const http = require('http');

const Router = require('../lib/router');
const bodyUnpacker = require('../lib/body-unpacker');
const jwtAuth = require('../lib/jwt-auth');
const errors = require('../lib/error-res');

const root = require('../routes/root');
const user = require('../routes/user');
const localNode = require('../routes/local-node');

module.exports = {};

function someMiddleware(handler) {
    return (req, res) => {
        res.write('middlewared ');
        handler(req, res);
    }
}

function noRouteHandler(path, method, req, res) {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    res.write('404 Not Found');
    res.end();
}

function noMethodHandler(path, method, req, res) {
    res.statusCode = 405;
    res.statusMessage = 'Method Not Allowed';
    res.write('405 Method Not Allowed');
    res.end();
}

const router = new Router(noRouteHandler, noMethodHandler);

router.assignRoute('GET', '/', root.get);
router.assignRoute('POST', '/', bodyUnpacker(root.post));
router.assignRoute(
    'GET',
    '/middlewaredemo',
    someMiddleware(require('../routes/root'))
)
router.assignRoute('POST', '/user', bodyUnpacker(user.post));
router.assignRoute('POST', '/user/login', bodyUnpacker(user.getToken));
router.assignRoute('GET', '/user/nodes', jwtAuth(user.getNodes));
router.assignRoute('POST', '/node', jwtAuth(bodyUnpacker(localNode.createNode)));
router.assignRoute('DELETE', '/node', jwtAuth(bodyUnpacker(localNode.deleteNode)));


module.exports.init = () => {
    return http.createServer(function (req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, HEAD");
        if (req.method == 'OPTIONS') {
            res.end();
            return;
        }
        res.setHeader('Content-Type', 'application/json');


        if (req.url.startsWith('/api')) {
            req.url = req.url.substring(4);
        }
        try {
            router.resolveRequest(req.url, req.method, req, res);
        } catch (e) {
            console.error(e);
            errors.endServerError(res);
        }
    }); 
}