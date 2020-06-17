
exports.seed = function (knex) {
  // Inserts seed entries
  return knex('email_template').insert([
    {
      "slug": 'trade_execute',
      "name": 'Trade Execution',
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
        `, note: `<p>
        you can use any of the following tags for make this template dynamic<br/>
        {{recipientName}} - For User's Firstname<br/>
      <p>`,
      "created_at": new Date(),
      "updated_at": null,
      "deleted_at": null,
      "all_content": { "en": { "subject": "Trade Execution", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been executed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{originalQuantity}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "English" }, "ja": { "subject": "Trade Execution", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been executed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Japanese" }, "es": { "subject": "Trade Execution", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been executed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Spanish" }, "uk": { "subject": "Trade Execution", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been executed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Ukrainian" }, "ru": { "subject": "Trade Execution", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been executed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Russia" }, "zh": { "subject": "Trade Execution", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been executed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Mandarin" } }
    },
    {
      "slug": 'tier_force_rejected',
      "name": 'Tier Force Rejection',
      "content": `<html>
                <head>
                  <title></title>
                </head>
                <body>
                <p>Hi&nbsp;{{recipientName}},</p>
                
                <p>You Tier has been forced rejected due to following reason :</p>
                
                <p> {{reason}} </p>
                
                <p>Warm Regards,<br />
                The FALDAX Team</p>
                </body>
                </html>
                `,
      "note": `<p>
              {{recipientName}} - For User's Firstname<br/>
            {{reason}} - For User's rejection reason<br/>
            </p>`,
      "created_at": new Date(),
      "updated_at": null,
      "deleted_at": null,
      "all_content": { "en": { "subject": "Tier Request Force Rejected", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your request to upgrade your Account Tier was rejected because:</p>\n\n<p>{{reason}}</p>\n\n<p>Please contact support via the ticket section of your account profile to re-open your request. Responding to this email&nbsp;will&nbsp;<strong>not</strong>&nbsp;be received by our support team. We apologize for any inconvenience.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "English" }, "ja": { "subject": "Tier Request Force Rejected", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force rejected due to following reason:</p>\n\n<p>{{reason}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Japanese" }, "es": { "subject": "Tier Request Force Rejected", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force rejected due to following reason:</p>\n\n<p>{{reason}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Spanish" }, "uk": { "subject": "Tier Request Force Rejected", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force rejected due to the following reason:</p>\n\n<p>{{reason}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Ukrainian" }, "ru": { "subject": "Tier Request Force Rejected", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force rejected due to the following reason:</p>\n\n<p>{{reason}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Russia" }, "zh": { "subject": "Tier Request Force Rejected", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force rejected due to the following reason:</p>\n\n<p>{{reason}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Mandarin" } }
    },
    {
      "slug": 'tier_force_approved',
      "name": 'Tier Force Approved',
      "content": `<html>
      <head>
        <title></title>
      </head>
      <body>
      <p>Hi&nbsp;{{recipientName}},</p>
      
      <p>You Tier has been forced accepted</p>
      
      <p>Warm Regards,<br />
      The FALDAX Team</p>
      </body>
      </html>`,
      "note": `<p>
              {{recipientName}} - For User's Firstname<br/>
              {{reason}} - For User's rejection reason<br/>
              </p>`,
      "created_at": new Date(),
      "updated_at": null,
      "deleted_at": null,
      "all_content": { "en": { "subject": "Tier Request Force Approved", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your request to upgrade your Account Tier is approved.&nbsp;</p>\n\n<p>Thank you for choosing FALDAX!</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "English" }, "ja": { "subject": "Tier Request Force Approved", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force approved and you have been upgraded to the next tier.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Japanese" }, "es": { "subject": "Tier Request Force Approved", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force approved and you have been upgraded to the next tier.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Spanish" }, "uk": { "subject": "Tier Request Force Approved", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force approved and you have been upgraded to the next tier.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Ukrainian" }, "ru": { "subject": "Tier Request Force Approved", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force approved and you have been upgraded to the next tier.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Russia" }, "zh": { "subject": "Tier Request Force Approved", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force approved and you have been upgraded to the next tier.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Mandarin" } }
    },
    {
      "slug": 'order_failed',
      "name": 'Order Failed',
      "content": `<html>
      <head>
        <title></title>
      </head>
      <body>
      <p>Hi&nbsp;{{recipientName}},</p>
      
      <p>Unfortunately, your recent order has&nbsp;failed due to {{reason}}. Please try again later.&nbsp;</p>
      
      <p>If this issue persists please <a href="https://trade.faldax.com/open-ticket">contact support</a>.</p>
      
      <p>Warm Regards,<br />
      The FALDAX Team</p>
      </body>
      </html>`,
      'note': `<p>
      {{recipientName}} - For User's Firstname<br/>
      {{reasons}} - Order Failed Reason
      <p>`,
      "created_at": new Date(),
      "updated_at": null,
      "deleted_at": null,
      'all_content': { "en": { "subject": "Order Failed", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Unfortunately, your recent order has&nbsp;failed due to {{reason}}. Please try again later.&nbsp;</p>\n\n<p>If this issue persists please <a href=\"https://preprod-trade.faldax.com/open-ticket\">contact support</a>.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "English" }, "ja": { "subject": "Order Failed", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Unfortunately, your recent order has&nbsp;failed due to {{reason}}. Please try again later.&nbsp;</p>\n\n<p>If this issue persists please <a href=\"https://preprod-trade.faldax.com/open-ticket\">contact support</a>.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Japanese" }, "es": { "subject": "Tier Request Force Approved", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force approved and you have been upgraded to the next tier.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Spanish" }, "uk": { "subject": "Tier Request Force Approved", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force approved and you have been upgraded to the next tier.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Ukrainian" }, "ru": { "subject": "Tier Request Force Approved", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force approved and you have been upgraded to the next tier.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Russia" }, "zh": { "subject": "Tier Request Force Approved", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi {{recipientName}},</p>\n\n<p>Your tier request has been force approved and you have been upgraded to the next tier.</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n      {{recipientName}} - For User's Firstname<br/>\n\n<p>", "language": "Mandarin" } }
    },
    {
      "slug": 'trade_place',
      'name': 'Trade Placed',
      "content": `< html >
        <head>
          <title></title>
        </head>
        <body>
          <p>Hi&nbsp;{{ recipientName }},</p>

          <p>Your trade order has been executed.</p>

          <p>Warm Regards,<br />
            The FALDAX Team</p>
        </body>
      </html>
    `,
      'note': `< p >
    you can use any of the following tags for make this template dynamic < br />
      {{ recipientName }
} - For User's Firstname<br/>
  <p>`,
      "created_at": new Date(),
      "updated_at": null,
      "deleted_at": null,
      'all_content': { "en": { "subject": "Trade Placed", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been placed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "English" }, "ja": { "subject": "Trade Placed", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been placed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Japanese" }, "es": { "subject": "Trade Placed", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been placed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Spanish" }, "uk": { "subject": "Trade Placed", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been placed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Ukrainian" }, "ru": { "subject": "Trade Placed", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been placed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Russia" }, "zh": { "subject": "Trade Placed", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order has been placed.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Mandarin" } }
    },
    {
      "slug": 'trade_partially_filled',
      'name': 'Trade Partially Filled',
      'content': `< html >
  <head>
    <title></title>
  </head>
  <body>
    <p>Hi&nbsp;{{ recipientName }},</p>

    <p>Your trade order has been executed.</p>

    <p>Warm Regards,<br />
      The FALDAX Team</p>
  </body>
      </html >
  `,
      'note': `< p >
  you can use any of the following tags for make this template dynamic < br />
    {{ recipientName }} - For User's Firstname<br/>
      <p>`,
      "created_at": new Date(),
      "updated_at": null,
      "deleted_at": null,
      'all_content': { "en": { "subject": "Trade Order Partially Filled", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is partially filled.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Amount</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{originalQuantity}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "English" }, "ja": { "subject": "Trade Order Partially Filled", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is partially filled.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Japanese" }, "es": { "subject": "Trade Order Partially Filled", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is partially filled.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Spanish" }, "uk": { "subject": "Trade Order Partially Filled", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is partially filled.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Ukrainian" }, "ru": { "subject": "Trade Order Partially Filled", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is partially filled.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Russia" }, "zh": { "subject": "Trade Order Partially Filled", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is partially filled.</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>{{allTradeData}}</p>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Mandarin" } }
    },
    {
      "slug": 'trade_stoplimit_pending',
      'name': 'Trade Stop-Limit Pending',
      'content': `< html >
      <head>
        <title></title>
      </head>
      <body>
        <p>Hi&nbsp;{{ recipientName }},</p>

        <p>Your trade order has been executed.</p>

        <p>Warm Regards,<br />
          The FALDAX Team</p>
      </body>
      </html >
  `,
      'note': `< p >
  you can use any of the following tags for make this template dynamic < br />
    {{ recipientName }} - For User's Firstname<br/>
      <p>`,
      "created_at": new Date(),
      "updated_at": null,
      "deleted_at": null,
      'all_content': { "en": { "subject": "Trade placed in pending book", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is in pending book. You will get notified once the order is executed</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Stop Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{stop_price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "English" }, "ja": { "subject": "Trade placed in pending book", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is in pending book. You will get notified once the order is executed</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Stop Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{stop_price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Japanese" }, "es": { "subject": "Trade placed in pending book", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is in pending book. You will get notified once the order is executed</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Stop Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{stop_price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Spanish" }, "uk": { "subject": "Trade placed in pending book", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is in pending book. You will get notified once the order is executed</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Stop Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{stop_price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Ukrainian" }, "ru": { "subject": "Trade placed in pending book", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is in pending book. You will get notified once the order is executed</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Stop Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{stop_price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Russia" }, "zh": { "subject": "Trade placed in pending book", "content": "<html>\n<head>\n\t<title></title>\n</head>\n<body>\n<p>Hi&nbsp;{{recipientName}},</p>\n\n<p>Your {{pair}} order is in pending book. You will get notified once the order is executed</p>\n\n<p><b>Your Order Details</b></p>\n\n<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>Pair</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{pair}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Side</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{side}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Order Type</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{order_type}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Quantity</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{quantity}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Trade Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{price}}</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Stop Price</td>\n\t\t\t<td>:</td>\n\t\t\t<td>{{stop_price}}</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n<p>Warm Regards,<br />\nThe FALDAX Team</p>\n</body>\n</html>\n", "note": "<p>\n\tyou can use any of the following tags for make this template dynamic<br/>\n\t{{recipientName}} - For User's Firstname<br/>\n<p>", "language": "Mandarin" } }
    }
  ]);
  // });
};
