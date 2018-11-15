# nodejs-restful-api

please go through the instruction:


# SIGNUP

PATH: `/signup` (POST)
SUMMARY: you have to pass `email`, `name`, `password` in post request. you'll get `x-access-token` in response with key `token`.


# LOGIN:

PATH: `/login` (GET)
SUMMARY: for login You have to pass `x-access-token`, created at the time of signup. then there will be an insert of `x-access-token` in user db as a field token.


# CHANGE PASSWORD:

PATH: '/changePassword' (POST)
SUMMARY: for change password, pass `x-access-token` as a header and `new_password` as a bodydata.


# EDIT USER DETAILS:

PATH: '/editUseDetails' (POST)
SUMMARY: pass any value from these: `email`, `name`, `password` or all three in bodydata and `x-access-token` in headers. then user details passed will only be update.


# USER INFO:

PATH: '/userInfo' (GET)
SUMMARY: pass `x-access-token` in headers and it'll provide all user data.


# PROFILE IMAGE UPLOAD:

PATH: '/profile_image_upload' (POST)
SUMMARY: pass `x-access-token` in headers and file image. it'll update in destination folder.


# LOGOUT:

PATH: '/logout' (GET)
SUMMARY: on logout event you have to pass `x-access-token` in request because there is no browser for now and we can not remove jwt tokens before expiry time so I'll remove thgem from user collection. In the same case we can insert these tokens in redis db so that we can have track about expired tokens.


