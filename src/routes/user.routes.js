'use strict';
// const { userList,  updateUser, addUser , userRoleList } = require('../controllers/user.contoller');
const { me } = require('../middleware/authentication');
const { catchAsync } = require('../util/catchAsync');
const router = require('express').Router();


// router.post('/list', catchAsync(async function _userList(req, res){
//     let data = await userList(req.body, req.loginUser)
//     res.success(data);
// }))
// .post('/me', me, catchAsync(async function _userList(req, res){
//     let data = await userList(req.body, req.loginUser)
//     res.success(data);
// }))
// .post('/create', catchAsync(async function _addUser(req, res){
//     let data = await addUser(req.body, req.loginUser);
//     res.success(data);
// }))
// .post('/update', catchAsync(async function _updateUser(req, res){
//     let data = await updateUser(req.body, req.loginUser);
//     res.success(data);
// }))
// .get('/role', catchAsync(async function _listRoles(req, res) {
//     let data = await userRoleList();
//     res.success(data);
// }))


module.exports = router;
