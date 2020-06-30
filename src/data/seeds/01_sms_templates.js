
exports.seed = function (knex) {

      // Inserts seed entries
      return knex('sms_template').insert([
            {
                  "slug": "kyc",
                  "name": "KYC Approve Success",
                  "content": `<html>
                    <head>
                      <title></title>
                    </head>
                    <body>
                    <p>Hi&nbsp;{{recipientName}},</p>

                    <p>Your identity verification&nbsp;has been approved.</p>

                    <p>We appreciate your patience and your business.</p>

                    <p>Warm Regards,</p>

                    <p>The FALDAX Team</p>
                    </body>
                    </html>
                  `,
                  "note": "",
                  "created_at": new Date()
            },
            {
                  "slug": "login_new_ip",
                  "name": "Login With New IP",
                  "content": `<html>
<head>
	<title></title>
</head>
<body>
<p>Hi&nbsp;{{recipientName}},</p>

<p>Someone has logged into your account from a new IP.</p>

<p>If this was not you, please contact support.</p>

<p>Warm Regards,</p>

<p>The FALDAX Team</p>
</body>
</html>
`,
                  "note": "",
                  "created_at": new Date()
            },
            {
                  "slug": "referal",
                  "name": "Referal Earned",
                  "content": `<html>
<head>
	<title></title>
</head>
<body>
<p>Hi&nbsp;{{recipientName}},</p>

<p>Your Referral has been earned successfully.</p>

<p>Warm Regards,</p>

<p>The FALDAX Team</p>
</body>
</html>
`,
                  "note": `<p>
      {{recipientName}} - For User''s Firstname<br/>
<p>`,
                  "created_at": new Date()
            },
            {
                  "slug": "withdraw",
                  "name": "Withdraw",
                  "content": `<html>
<head>
	<title></title>
</head>
<body>
<p>Hi&nbsp;{{recipientName}},</p>

<p>You have withdrawn {{amountReceived}}&nbsp;{{coin}}.</p>

<p>Warm Regards,</p>

<p>The FALDAX Team</p>
</body>
</html>
`,
                  "note": `<p>
	you can use any of the following tags for make this template dynamic<br/>
	{{recipientName}} - For User''s Firstname<br/>
{{coin}} - User''s coin
{{amountReceived}} - Amount send
<p>`,
                  "created_at": new Date()
            },
            {
                  "slug": "receive",
                  "name": "Receive",
                  "content": `<html>
<head>
	<title></title>
</head>
<body>
<p>Hi&nbsp;{{recipientName}},</p>

<p>You have received {{amountReceived}} {{coin}}.</p>

<p>Warm&nbsp;Regards,</p>

<p>The FALDAX Team</p>
</body>
</html>
`,
                  "note": `<p>
	you can use any of the following tags for make this template dynamic<br/>
	{{recipientName}} - For User''s Firstname<br/>
<p>`,
                  "created_at": new Date()
            },
            {
                  "slug": "order_failed",
                  "name": "Order Failed",
                  "content": `<html>
<head>
	<title></title>
</head>
<body>
<p>Hi&nbsp;{{recipientName}},</p>

<p>Unfortunately, your recent order has&nbsp;failed due to {{reason}}. Please try again later.&nbsp;</p>

<p>If this issue persists please <a href='"https://trade.faldax.com/open-ticket'">contact support</a>.</p>

<p>Warm Regards,<br />
The FALDAX Team</p>
</body>
</html>
`,
                  "note": `<p>
      {{recipientName}} - For User''s Firstname<br/>
{{reasons}} - Order Failed Reason
<p>`,
                  "created_at": new Date()
            },
            {
                  "slug": "trade_partially_filled",
                  "name": "Trade Partially Filled",
                  "content": `<html>
      <head>
            <title></title>
      </head>
      <body>
      <p>Hi&nbsp;{{recipientName}},</p>
      
      <p>Your trade order has been executed.</p>
      
      <p>Warm Regards,<br />
      The FALDAX Team</p>
      </body>
      </html>
`,
                  "note": `<p>
	you can use any of the following tags for make this template dynamic<br/>
	{{recipientName}} - For User''s Firstname<br/>
<p>`,
                  "created_at": new Date()
            },
            {
                  "slug": "trade_execute",
                  "name": "Trade Execution",
                  "content": `<html>
      <head>
            <title></title>
      </head>
      <body>
      <p>Hi&nbsp;{{recipientName}},</p>
      
      <p>Your trade order has been executed.</p>
      
      <p>Warm Regards,<br />
      The FALDAX Team</p>
      </body>
      </html>
`,
                  "note": `<<p>
	you can use any of the following tags for make this template dynamic<br/>
	{{recipientName}} - For User''s Firstname<br/>
<p>`,
                  "created_at": new Date()
            },
            {
                  "slug": "trade_place",
                  "name": "Trade Placed",
                  "content": `<html>
      <head>
            <title></title>
      </head>
      <body>
      <p>Hi&nbsp;{{recipientName}},</p>
      
      <p>Your trade order has been executed.</p>
      
      <p>Warm Regards,<br />
      The FALDAX Team</p>
      </body>
      </html>
`,
                  "note": `<p>
	you can use any of the following tags for make this template dynamic<br/>
	{{recipientName}} - For User''s Firstname<br/>
<p>`,
                  "created_at": new Date()
            },
            {
                  "slug": "trade_stoplimit_pending",
                  "name": "Trade Stop-Limit Pending",
                  "content": `<html>
      <head>
            <title></title>
      </head>
      <body>
      <p>Hi&nbsp;{{recipientName}},</p>
      
      <p>Your trade order has been executed.</p>
      
      <p>Warm Regards,<br />
      The FALDAX Team</p>
      </body>
      </html>
`,
                  "note": `<p>
	you can use any of the following tags for make this template dynamic<br/>
	{{recipientName}} - For User''s Firstname<br/>
<p>`,
                  "created_at": new Date()
            }
      ]);
};
