
exports.seed = function (knex) {
  // // Deletes ALL existing entries
  // return knex('table_name').del()
  //   .then(function () {
  // Inserts seed entries
  return knex('table_name').insert([
    {
      // id: 1,
      tier_step: '3',
      minimum_activity_thresold: `{"Account_Age":"60","Minimum_Total_Transactions":"50","Minimum_Total_Value_of_All_Transactions":"25000"}`,
      requirements: `{"IDCP":"IDCP","proof_of_assets":"Proof of Assets Form "}`,
      created_at: '2020-05-14 15:01:21.502',
      requirements_two: `{"Total_Wallet_Balance":"50000"}`,
      daily_withdraw_limit: 'Unlimited',
      monthly_withdraw_limit: 'Unlimited'
    },
    {
      // id: 1,
      tier_step: '2',
      minimum_activity_thresold: `{"Account_Age":"30","Minimum_Total_Transactions":"25","Minimum_Total_Value_of_All_Transactions":"50000"}`,
      requirements: `{"2FA":"2FA","valid_id":"Valid ID","proof_of_residence":"Proof of Residence","ssn":"Social Security # or Equivalent Govt. Issued ID Number (if applicable)"}`,
      created_at: '2020-05-14 15:01:21.502',
      requirements_two: `{"Total_Wallet_Balance":"25000"}`,
      daily_withdraw_limit: '25000',
      monthly_withdraw_limit: '500000'
    },
    {
      // id: 1,
      tier_step: '1',
      minimum_activity_thresold: `{"Account_Age":"0","Minimum_Total_Transactions":"0","Minimum_Total_Value_of_All_Transactions":"0"}`,
      requirements: `{"Login":"Login","Email":"Email","full_name":"Full Name","dob":"Date of Birth","phone_number":"Phone Number","physical_address":"Physical Address"}`,
      created_at: '2020-05-20 10:24:44.296',
      requirements_two: `{"Total_Wallet_Balance":"0"}`,
      daily_withdraw_limit: '5000',
      monthly_withdraw_limit: '150000'
    },
    {
      // id: 1,
      tier_step: '4',
      minimum_activity_thresold: `{"Account_Age":"0","Minimum_Total_Transactions":"0","Minimum_Total_Value_of_All_Transactions":"0"}`,
      requirements: `{"aml":"AML Questionnaire","comfort_letter":"Comfort Letter","board_resolution":"Board Resolution","month_bank_statments":"Bank Statement (2 Months)","corporate_filing_information":"Corporate Filing Documents","ownership_form":"Beneficial Ownership Form","incorporation":"Articles of Incorporation","bylaws":"Company Bylaws","control_structue":"Ownership and Control Structure","officers_list":"ID Verification Documents of Directors and Officers with 10% Equity or Higher","active_business_address":"Proof of Active Business Address","document_policy":"Document Availability Policy","cookies_policy":"Cookies Policy","privacy_policy":"Privacy Policy","aml_policy":"AML Policy","terms_of_service":"Terms of Service"}`,
      created_at: '2020-05-15 11:29:28.809',
      requirements_two: `{"Total_Wallet_Balance":"0"}`,
      daily_withdraw_limit: 'Unlimited',
      monthly_withdraw_limit: 'Unlimited'
    }
  ]);
  // });
};
