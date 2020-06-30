
exports.seed = function (knex) {

  // Inserts seed entries
  return knex('sms_template').insert([
    {
      "slug": "kyc",
      "name": "KYC Approve Success",
      "content": "Hello,\n\nYour KYC has been approved successfully.\n\nThanks for joinning FALDAX team\n\nRegards\nFALDAX",
      "note": "",
      "created_at": "2019-06-05 06:11:01.23"
    },
    {
      "slug": "thresold_notification",
      "name": "Thresold Notification",
      "content": "Hello,\n\nYour prices set for the notification has reached.\n\nThanks for joinning FALDAX team\n\nRegards\nFALDAX",
      "note": "",
      "created_at": "2019-06-05 06:11:01.23"
    },
    {
      "slug": "first_limit_low",
      "name": "Low Wallet Balance below first limit",
      "content": "Hello,\n\nYou warm wallet balance has been low below first limit. So please add coins to fulfill the warm wallet balance\n\nThanks for joinning FALDAX team\n\nRegards\nFALDAX",
      "note": "",
      "created_at": "2019-06-05 06:11:01.23"
    },
    {
      "slug": "second_limit_low",
      "name": "Low Wallet Balance below second limit",
      "content": "Hello,\n\nYou warm wallet balance has been low below second limit. So please add coins to fulfill the warm wallet balance\n\nThanks for joinning FALDAX team\n\nRegards\nFALDAX",
      "note": "",
      "created_at": "2019-06-05 06:11:01.23"
    },
    {
      "slug": "third_limit_low",
      "name": "Low Wallet Balance below third limit",
      "content": "Hello,\n\nYou warm wallet balance has been low below third limit. So please add coins to fulfill the warm wallet balance\n\nThanks for joinning FALDAX team\n\nRegards\nFALDAX",
      "note": "",
      "created_at": "2019-06-05 06:11:01.23"
    },
    {
      "slug": "login_new_ip",
      "name": "Login With New IP",
      "content": "Hello,\n\nYour account has been logged in from new device.\n\nThanks for joinning FALDAX team\n\nRegards\nFALDAX",
      "note": "",
      "created_at": "2019-06-05 06:11:01.23"
    },
    {
      "slug": "user_wallet_address_creation",
      "name": "User Wallet Address Creation",
      "content": "Hello,\n\nYou wallet address has been created\n\nThanks for joinning FALDAX team\n\nRegards\nFALDAX",
      "note": "",
      "created_at": "2019-06-05 06:11:01.23"
    },
    {
      "slug": "panic_status_disabled",
      "name": "Panic Status Disabled",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>The Panic Button has been disabled. All trading is now open.</p>\n\n<p>Warm&nbsp;Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n      {{coin}} - For Asset<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "verification_code",
      "name": "Verification Code",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Welcome to FALDAX.</p>\n\n<p>We just need to verify your email address before your sign up is complete. Please enter following code to activate your account.</p>\n\n<p><b>{{code}}</b></p>\n\n<p>Thank you so much for joining us.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n\t{{code}} - For verification code<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "profile_change_password_sf",
      "name": "Profile password change with Security Feature",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your Password&nbsp;has been updated successfully. As you have enabled Security Feature, You can not withdraw&nbsp;funds for 24 hours.</p>\n\n<p>Please try to login&nbsp;with your new password.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "new_ip_whitelist",
      "name": "New IP address in whitelist",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>The&nbsp;IP Address <strong>{{newIPAddress}}</strong>&nbsp;has been&nbsp;added to&nbsp;your whitelist.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n{{newIPAddress}} - Which is New IP address added in IP Whitelist\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "user_limit_updation",
      "name": "User Limit Updated",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>An asset limit has been updated. If you have any questions please <a href='\"https://trade.faldax.com/open-ticket'\">contact support</a>.</p>\n\n<p>Warm&nbsp;Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "panic_status_enabled",
      "name": "Panic Status Enabled",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>The Panic Button has been enabled. All trading will be closed for the next 24 hours.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n      {{coin}} - For Asset<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "own_whitelist_enable_disable",
      "name": "IP Whitelist Enable/Disable",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You have <strong>{{status}}</strong> IP Whitelist.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n{{status}} - Enabled/Disabled\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "profile_change_password",
      "name": "Reset Password",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p><strong>Your Password&nbsp;has been updated successfully.</strong></p>\n\n<p>Please try to login with the new password.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "referral",
      "name": "Referral Earning",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You currently have referral earnings to collect. Please proceed to the referral section of your profile to collect your referral earnings.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875",
      "updated_at": "2020-02-06 15:43:24.805"
    },
    {
      "slug": "withdraw",
      "name": "Withdraw",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You have withdrawn {{amountReceived}} for this {{coin}}.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n{{coin}} - User''s coin\n{{amountReceived}} - Amount send\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "wallet_created_successfully",
      "name": "ETH Wallet address created",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your ETH wallet&nbsp;has been created successfully. Please check your wallet.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n\n<p>",
      "created_at": "2020-02-05 14:53:15.958"
    },
    {
      "slug": "deactivate_user",
      "name": "Deactivate Account summary",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your account has been deactivated. Your wallet summary is shown&nbsp;below:</p>\n\n<p>{{summary}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n\n{{summary}} - User Delete Account summary\n<p>",
      "created_at": "2020-02-05 14:53:15.958"
    },
    {
      "slug": "approve_withdraw_request",
      "name": "Approve Withdraw Request",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You withdrawal request has been approved. Please check your wallet history.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n\n<p>",
      "created_at": "2020-02-05 14:53:15.958"
    },
    {
      "slug": "security_feature_enable_disable",
      "name": "Security Feature Enable/Disable",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You have <strong>{{status}}</strong> Security Feature.</p>\n\n<p>Note : When you enable Security Feature, you will be restricted from&nbsp;performing any withdrawal for 24 hours when you change password, reset new password, change email address, disable Two-Factor Authentication, or when you add an IP address to your&nbsp;IP Whitelist.&nbsp;</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n{{status}} - Enabled/Disabled\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "panic_email",
      "name": "Panic Button Email",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Our systems have detected an anomaly, and FALDAX administrators have frozen all trade operations and wallets in the interest of maintaining security of your funds and information.</p>\n\n<p>We are working to determine the cause of this issue and will resume all operations as soon as possible. At the moment, this is a precaution and we believe that your funds and information are safe. If you notice anything out of the ordinary in your account, please submit a ticket or email <a href='\"mailto:support@faldax.com'\" target='\"_top'\">support@faldax.com.</a></p>\n\n<p>Our system will automatically close any open orders if 24 hours pass and the exchange has not opened. Alternatively, you may cancel any open orders manually or let the remain in the event that trading resumes within the 24-hour window.</p>\n\n<p>You will receive a notification if anything important changes and when trading resumes. Please visit our twitter page&nbsp;or Facebook page for more frequent updates.</p>\n\n<p>We appreciate your patience and your business.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "2fa_enable_disable_sf",
      "name": "2FA Enable/Disable with Security Feature",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You have <strong>{{status}}</strong> 2 Factor Authentication. Since&nbsp;you have enabled Security Feature, you can not withdraw&nbsp;funds for 24 hours.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n{{status}} - Enabled/Disabled\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "twofactor_request_email_approved",
      "name": "Two Factor Request Approved",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>The request to reset&nbsp;your Two-Factor Authentication has been approved. Your Two-Factor Authentication has been disabled and you can now login to your account.</p>\n\n<p>Warm&nbsp;Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "kyc_approved",
      "name": "KYC Approved",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your identity verification&nbsp;has been approved.</p>\n\n<p>We appreciate your patience and your business.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n{{newIPAddress}} - Which is New IP address added in IP Whitelist\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "twofactor_request_email_rejected",
      "name": "Two Factor Request Rejected",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your request to reset your Two-Factor Authentication has been rejected for the reason below.<br />\n<br />\n<strong>Reason :&nbsp;</strong><br />\n<em>{{reason}}</em></p>\n\n<p>Warm&nbsp;Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n{{reason}} -Rejected reason<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "twofactor_request_email_approved_sf",
      "name": "Two Factor Request Approved with Security Features",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your request to reset&nbsp;your Two-Factor Authentication has been approved. Your Two-Factor Authentication has been disabled and you can now login to your account.<strong> </strong>But you will not be&nbsp;able to withdraw funds for 24 hours.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "order_added",
      "name": "Order Added",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your order has been added successfully.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "receive",
      "name": "Receive",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You have received {{amountReceived}} {{coin}}.</p>\n\n<p>Warm&nbsp;Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "jst_order_success",
      "name": "Order Created Successfully",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Congratulations!&nbsp;Your order of {{firstAmount}} {{firstCoin}}, in exchange for {{secondAmount}} {{secondCoin}} has been received.</p>\n\n<p>Please check your transaction history for updates.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "new_ip_verification",
      "name": "New IP Verification",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi<i> </i>{{recipientName}}<i>,</i><br />\n<br />\nWe detected an attempt to sign into your FALDAX account from a new device and/or location. In an effort to ensure account security, we ask that you review the details of the sign-in attempt below:<br />\n<br />\nIP<i> </i>Address<i>: </i>{{ip}}</p>\n\n<p>You can authorize this sign-in attempt by clicking the button below if the attempt was legitimate. Please note that if you&nbsp;are trying to access your account on a new device, you <b>must authorize the device via the button below using that same device.&nbsp;</b></p>\n\n<p><a href='\"{{homeLink}}/login/?IpVerifyToken={{token}}'\" style='\"text-decoration: none;width: 100%;font-size: 11px;color: #FFFFFF;background-color: #1890ff;letter-spacing: 2px;border-radius: 13px;-webkit-box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.45);padding:10px;cursor: pointer;'\" target='\"_blank'\">Yes, This Was Me</a></p>\n\n<p>If this was not you, please<i>&nbsp;</i><a data-saferedirecturl='\"https://www.google.com/url?q=https://trade.faldax.com/open-ticket&amp;source=gmail&amp;ust=1569493393770000&amp;usg=AFQjCNHk5cg8VlcXK5TtbvwtOdOEwFQulw'\" href='\"https://trade.faldax.com/open-ticket'\" target='\"_blank'\">CONTACT SUPPORT</a><i>&nbsp;</i>immediately.<br />\n<br />\nWarm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n\t{{ip}} - For User''s IP <br/>\n\t{{token}} - For IP verification link\n\t{{homeLink}} - For home page link\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "new_email_verification_sf",
      "name": "New Email verification with Security Feature",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your email has been&nbsp;updated. Since&nbsp;you have enabled Security Feature, you cannot withdraw&nbsp;funds for 24 hours.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n\t{{token}} - For verification link or token\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "admin_whitelist_enable_disable",
      "name": "IP Whitelist Enable/Disable by Admin",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your IP Whitelist has been <strong>{{status}}</strong> by an Admin.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n{{status}} - Enabled/Disabled\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "disapprove_withdraw_request",
      "name": "DisApproved Withdraw Request",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You withdrawal request has been disapproved. Please check your withdrawal request history.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n\n<p>",
      "created_at": "2020-02-05 14:53:15.958"
    },
    {
      "slug": "tier_force_approved",
      "name": "Tier Force Approved",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You Tier has been forced accepted</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n     {{reason}} - For User''s rejection reason<br/>\n</p>",
      "created_at": "2020-02-05 14:53:15.958"
    },
    {
      "slug": "tier_force_rejected",
      "name": "Tier Force Rejection",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You Tier has been forced rejected due to following reason :</p>\n\n<p> {{reason}} </p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n     {{reason}} - For User''s rejection reason<br/>\n</p>",
      "created_at": "2020-02-05 14:53:15.958"
    },
    {
      "slug": "new_email_confirmation",
      "name": "Email Change Confirmation",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>We just need to confirm your old&nbsp;email address before updating it. Please enter the following code to confirm your new&nbsp;email address.</p>\n\n<p><b>{{tokenCode}}</b></p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n\t{{tokenCode}} - For verification link or token\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "2fa_enable_disable",
      "name": "2FA Enable/Disable",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You have <strong>{{status}}</strong>&nbsp;Two-Factor Authentication.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n{{status}} - Enabled/Disabled\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "new_ip_whitelist_sf",
      "name": "New IP address in whitelist with Security Feature",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>The&nbsp;IP Address <strong>{{newIPAddress}}</strong>&nbsp;has been&nbsp;added to&nbsp;your whitelist. Since&nbsp;you have enabled Security Feature, you can not withdraw&nbsp;funds for 24 hours.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n{{newIPAddress}} - Which is New IP address added in IP Whitelist\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "change_password_subadmin",
      "name": "Change Password For Sub Admin",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your password has been updated.<br />\n<br />\n<strong>Date &amp; Time:</strong> {{datetime}}<br />\n<strong>Browser:</strong> {{browser}}<br />\n<strong>IP Address (Location):</strong> {{ip}}<br />\n<br />\nPlease contact an Admin to retrieve your credentials.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For Employee''s Firstname<br/>\n{{ip}} - For IP Address<br/>\n{{datetime}} - For Date & Time of Activity<br/>\n{{browser}} - Fro Browser details of Activity<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875"
    },
    {
      "slug": "new_email_verification",
      "name": "New Email verification",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Welcome to FALDAX.</p>\n\n<p>We&nbsp;need to verify your new email address. Please click the&nbsp;button bellow&nbsp;to activate your account.</p>\n\n<p><a href='\"{{token}}'\" style='\"text-decoration: none;width: 100%;font-size: 11px;color: #FFFFFF;background-color: #1890ff;letter-spacing: 2px;border-radius: 13px;-webkit-box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.45);padding:10px;cursor: pointer;'\" target='\"_blank'\">Activate your account</a></p>\n\n<p>Thank you so much for joining us.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n\t{{token}} - For verification link or token\n<p>",
      "created_at": "2019-05-22 09:44:55.875",
      "updated_at": "2020-02-05 14:53:25.059",
      "deleted_at": "2019-06-05 14:20:54.346"
    },
    {
      "slug": "forgot_password",
      "name": "Forgot Password",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>You have requested a password reset, please click the link below to continue. If this was not you, please <a href='\"http://trade.faldax.com/open-ticket'\">contact support</a> immediately.</p>\n\n<p><a href='\"{{token}}'\" style='\"text-decoration: none;width: 100%;font-size: 11px;color: #FFFFFF;background-color: #1890ff;letter-spacing: 2px;border-radius: 13px;-webkit-box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.45);padding:10px;cursor: pointer;'\" target='\"_blank'\">Reset Your Password</a></p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n\t{{token}} - For reset password link\n<p>",
      "created_at": "2019-05-22 09:44:55.875",
      "updated_at": "2020-02-05 14:54:53.115"
    },
    {
      "slug": "jst_order_failed",
      "name": "Order Failed",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Unfortunately, your recent order has&nbsp;failed. Please try again later.&nbsp;</p>\n\n<p>If this issue persists please <a href='\"https://trade.faldax.com/open-ticket'\">contact support</a>.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875",
      "updated_at": "2020-02-05 15:45:13.352"
    },
    {
      "slug": "signup_for_mobile",
      "name": "Signup Email For Mobile",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Welcome to FALDAX.</p>\n\n<p>We just need to verify your email address, IP, and device&nbsp;before your sign up is complete. Please enter following code to activate your account.</p>\n\n<p><b>{{tokenCode}}</b></p>\n\n<p>Thank you so much for joining us.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n\t{{tokenCode}} - For verification link or token\n<p>",
      "created_at": "2019-05-22 09:44:55.875",
      "updated_at": "2020-02-06 16:18:31.246"
    },
    {
      "slug": "signup_for_web",
      "name": "Signup Email For Website",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Welcome to FALDAX<i>, </i>{{recipientName}}<i>!</i><br />\n<br />\nWe need to verify your email address, IP, and device&nbsp;before your new account is activated. Please click on the button below to complete the registration process.&nbsp;</p>\n\n<p><i><a href='\"{{token}}'\" style='\"text-decoration: none;width: 100%;font-size: 11px;color: #FFFFFF;background-color: #1890ff;letter-spacing: 2px;border-radius: 13px;-webkit-box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.45);padding:10px;cursor: pointer;'\" target='\"_blank'\">Activate Your Account</a></i></p>\n\n<p><br />\nWarm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n\t{{token}} - For verification link or token\n<p>",
      "created_at": "2019-05-22 09:44:55.875",
      "updated_at": "2020-02-06 16:19:10.867"
    },
    {
      "slug": "order_failed",
      "name": "Order Failed",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Unfortunately, your recent order has&nbsp;failed due to {{reason}}. Please try again later.&nbsp;</p>\n\n<p>If this issue persists please <a href='\"https://trade.faldax.com/open-ticket'\">contact support</a>.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n      {{recipientName}} - For User''s Firstname<br/>\n{{reasons}} - Order Failed Reason\n<p>",
      "created_at": "2020-05-20 13:42:43.126",
      "updated_at": "2020-05-20 13:42:43.126"
    },
    {
      "slug": "trade_partially_filled",
      "name": "Trade Partially Filled",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your trade order has been executed.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2020-05-22 09:44:55.875",
      "updated_at": "2020-06-03 11:50:40.86"
    },
    {
      "slug": "trade_execute",
      "name": "Trade Execution",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your trade order has been executed.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875",
      "updated_at": "2020-06-03 10:20:58.864"
    },
    {
      "slug": "trade_place",
      "name": "Trade Placed",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your trade order has been executed.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2020-05-22 09:44:55.875",
      "updated_at": "2020-05-26 10:49:26.904"
    },
    {
      "slug": "trade_stoplimit_pending",
      "name": "Trade Stop-Limit Pending",
      "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your trade order has been executed.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>",
      "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User''s Firstname<br/>\n<p>",
      "created_at": "2019-05-22 09:44:55.875",
      "updated_at": "2020-05-26 10:50:04.862"
    }
  ]);
};
