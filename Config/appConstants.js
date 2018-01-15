'use strict';



var PORT;

if (process.env.NODE_ENV == 'test') {
    PORT = 8001;
} else if (process.env.NODE_ENV == 'dev') {
    PORT = 8002;
} else {
    PORT = 8000;
}


var DOMAIN_NAME_MAIL = 'http://13.76.215.218';
var SERVER = {
    APP_NAME: 'Fanspick',
    PORTS: {
        HAPI: PORT
    },
    TOKEN_EXPIRATION_IN_MINUTES: 600,
    JWT_SECRET_KEY: 'sUPerSeCuREKeY&^$^&$^%$^%7782348723t4872t34Ends',
    GOOGLE_API_KEY: 'AIzaSyBO2bhirASSGwMDzaO64hisl7CMDX1_Whg',
    COUNTRY_CODE: '+91',
    MAX_DISTANCE_RADIUS_TO_SEARCH: '1',
    THUMB_WIDTH: 50,
    THUMB_HEIGHT: 50,
    BASE_DELIVERY_FEE: 25,
    COST_PER_KM: 9, // In USD
    DOMAIN_NAME: 'http://localhost:8000/',
    SUPPORT_EMAIL: 'support@fanspick.com'
};

var DATABASE = {
    PROFILE_PIC_PREFIX: {
        ORIGINAL: 'profilePic_',
        THUMB: 'profileThumb_'
    },
    LOGO_PREFIX: {
        ORIGINAL: 'logo_',
        THUMB: 'logoThumb_'
    },
    DOCUMENT_PREFIX: 'document_',
    USER_ROLES: {
        ADMIN: 'ADMIN',
        USER: 'USER',
        FANSPICK: 'FANSPICK'
    },
    FILE_TYPES: {
        LOGO: 'LOGO',
        DOCUMENT: 'DOCUMENT',
        OTHERS: 'OTHERS'
    },
    LOGIN_TYPE: {
        SIMPLE: 'SIMPLE',
        FACEBOOK: 'FACEBOOK',
        GOOGLE: 'GOOGLE'
    },
    FAV_TEAM_TYPE: {
        PRIMARY: 'PRIMARY',
        SECONDARY: 'SECONDARY'
    },
    DEVICE_TYPES: {
        IOS: 'IOS',
        ANDROID: 'ANDROID',
        WEB: 'WEB'
    },
    EVENT_TYPES: {
        USER_SIGNIN: 'userSignIn',
        APP_START: 'applicationStarted',
        ACC_CREATE: 'accountCreationStart',
        ACC_COMP: 'accountCreationComplete',
        ACC_UPDATE: 'accountCreationComplete',
        TEAM_SEL: 'teamSelection',
        FIX_SEL: 'fixtureSelection',
        COM_SEL: 'communitySelected',
        TOPIC_SEL: 'topicSelected',
        BILL_OPEN: 'billboardOpened',
        BILL_SEL: 'billboardSelected',
        ALERT_CLICKED: 'alertClicked',
        ALERT_BANNER_VIEW: 'alertBannerView',
        ALERT_LINK_CLICKS: 'alertLinkClicks',
        MANAGERS_PICK: 'managersPick',
        FANS_PICK: 'fansPick',
        SOCIAL_CLICK: 'socialClick',
        COMMENTARY_VIEWED: 'commentaryViewed'
    },
    LANGUAGE: {
        EN: 'EN',
        ES_MX: 'ES_MX'
    },
    PAYMENT_OPTIONS: {
        CREDIT_DEBIT_CARD: 'CREDIT_DEBIT_CARD',
        PAYPAL: 'PAYPAL',
        BITCOIN: 'BITCOIN',
        GOOGLE_WALLET: 'GOOGLE_WALLET',
        APPLE_PAY: 'APPLE_PAY',
        EIYA_CASH: 'EIYA_CASH'
    },

    sponsorBillboardTargetType: {
        fixture: "Fixture",
        competition: "Competition",
        country: "Country"
    },

    sponsorImageType: {
        billboard: 'Billboard',
        pitch: 'Pitch'
    },

    YOUR_PICK_TYPE: {
        LIVE: "YOUR_PICK_LIVE",
        PRE_MATCH: "YOUR_PICK_PRE_MATCH",
        MANAGER_PICK: "MANAGER_PICK_LIVE"
    },

    COMPETITIONS: {
        EUROPA_LEAGUE: 'UEFA Europa League',
        CHAMPIONS_LEAGUE: 'UEFA Champions League',
        FA_CUP: 'FA Cup'
    }
};

var STATUS_MSG = {
    ERROR: {
        INVALID_USER_PASS: {
            statusCode: 401,
            type: 'INVALID_USER_PASS',
            customMessage: 'Invalid username or password'
        },
        TOKEN_ALREADY_EXPIRED: {
            statusCode: 401,
            customMessage: 'Token Already Expired',
            type: 'TOKEN_ALREADY_EXPIRED'
        },
        DB_ERROR: {
            statusCode: 400,
            customMessage: 'DB Error : ',
            type: 'DB_ERROR'
        },
        INVALID_ID: {
            statusCode: 400,
            customMessage: 'Invalid Id Provided',
            type: 'INVALID_ID'
        },
        INVALID_DATE: {
            statusCode: 400,
            customMessage: 'Date should be greater then current date.',
            type: 'INVALID_DATE'
        },
        NO_COMMENT_FOUND: {
            statusCode: 400,
            customMessage: 'No Comment Found',
            type: 'NO_COMMENT_FOUND'
        },
        INVALID_CARDID: {
            statusCode: 400,
            customMessage: 'Invalid Card Id',
            type: 'INVALID_CARDID'
        },
        APP_ERROR: {
            statusCode: 400,
            customMessage: 'Application Error',
            type: 'APP_ERROR'
        },
        ADDRESS_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Address not found',
            type: 'ADDRESS_NOT_FOUND'
        },
        SAME_ADDRESS_ID: {
            statusCode: 400,
            customMessage: 'Pickup and Delivery Address Cannot Be Same',
            type: 'SAME_ADDRESS_ID'
        },
        PICKUP_ADDRESS_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Pickup Address not found',
            type: 'PICKUP_ADDRESS_NOT_FOUND'
        },
        DELIVERY_ADDRESS_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Delivery Address not found',
            type: 'DELIVERY_ADDRESS_NOT_FOUND'
        },
        IMP_ERROR: {
            statusCode: 500,
            customMessage: 'Implementation Error',
            type: 'IMP_ERROR'
        },
        APP_VERSION_ERROR: {
            statusCode: 400,
            customMessage: 'One of the latest version or updated version value must be present',
            type: 'APP_VERSION_ERROR'
        },
        INVALID_TOKEN: {
            statusCode: 401,
            customMessage: 'Invalid token provided',
            type: 'INVALID_TOKEN'
        },
        INVALID_CODE: {
            statusCode: 400,
            customMessage: 'Invalid Verification Code',
            type: 'INVALID_CODE'
        },
        DEFAULT: {
            statusCode: 400,
            customMessage: 'Error',
            type: 'DEFAULT'
        },
        PHONE_NO_EXIST: {
            statusCode: 400,
            customMessage: 'Phone No Already Exist',
            type: 'PHONE_NO_EXIST'
        },
        EMAIL_EXIST: {
            statusCode: 400,
            customMessage: 'Email Already Exist',
            type: 'EMAIL_EXIST'
        },
        DUPLICATE: {
            statusCode: 400,
            customMessage: 'Duplicate Entry',
            type: 'DUPLICATE'
        },
        DUPLICATE_ADDRESS: {
            statusCode: 400,
            customMessage: 'Address Already Exist',
            type: 'DUPLICATE_ADDRESS'
        },
        UNIQUE_CODE_LIMIT_REACHED: {
            statusCode: 400,
            customMessage: 'Cannot Generate Unique Code, All combinations are used',
            type: 'UNIQUE_CODE_LIMIT_REACHED'
        },
        INVALID_REFERRAL_CODE: {
            statusCode: 400,
            customMessage: 'Invalid Referral Code',
            type: 'INVALID_REFERRAL_CODE'
        },
        FACEBOOK_ID_PASSWORD_ERROR: {
            statusCode: 400,
            customMessage: 'Only one field should be filled at a time, either facebookId or password',
            type: 'FACEBOOK_ID_PASSWORD_ERROR'
        },
        GOOGLE_ID_PASSWORD_ERROR: {
            statusCode: 400,
            customMessage: 'Only one field should be filled at a time, either Google or password',
            type: 'GOOGLE_ID_PASSWORD_ERROR'
        },
        TYPE_ALL_ERROR: {
            statusCode: 400,
            customMessage: 'Only one field should be filled at a time, either facebook or google',
            type: 'TYPE_ALL_ERROR'
        },
        TYPE_STATUS_ERROR: {
            statusCode: 400,
            customMessage: 'Only one field should be filled at a time, status or changes',
            type: 'TYPE_STATUS_ERROR'
        },
        INVALID_EMAIL: {
            statusCode: 400,
            customMessage: 'Invalid Email Address',
            type: 'INVALID_EMAIL'
        },
        CARD_DIGIT_REQUIRED: {
            statusCode: 400,
            customMessage: 'Card last 3 digit required',
            type: 'CARD_DIGIT_REQUIRED'
        },
        PAYPALID_REQUIRED: {
            statusCode: 400,
            customMessage: 'Paypal Id required',
            type: 'PAYPALID_REQUIRED'
        },
        PASSWORD_REQUIRED: {
            statusCode: 400,
            customMessage: 'Password is required',
            type: 'PASSWORD_REQUIRED'
        },
        DONATION_REQUIRED: {
            statusCode: 400,
            customMessage: 'Donation Id is required',
            type: 'DONATION_REQUIRED'
        },
        INVALID_COUNTRY_CODE: {
            statusCode: 400,
            customMessage: 'Invalid Country Code, Should be in the format +52',
            type: 'INVALID_COUNTRY_CODE'
        },
        INVALID_PHONE_NO_FORMAT: {
            statusCode: 400,
            customMessage: 'Phone no. cannot start with 0',
            type: 'INVALID_PHONE_NO_FORMAT'
        },
        CHARITYOWNERID: {
            statusCode: 400,
            customMessage: 'Charity Owner Id Required',
            type: 'INVALID_CHARITY_ID'
        },
        COUNTRY_REQUIRED: {
            statusCode: 400,
            customMessage: 'Country is Required',
            type: 'COUNTRY_REQUIRED'
        },
        REGISTRATIONNUMBER_REQUIRED: {
            statusCode: 400,
            customMessage: 'Charity Registration Number is Required',
            type: 'REGISTRATIONNUMBER_REQUIRED'
        },
        STATE_REQUIRED: {
            statusCode: 400,
            customMessage: 'State is Required',
            type: 'STATE_REQUIRED'
        },
        FIRSTNAME_REQUIRED: {
            statusCode: 400,
            customMessage: 'First Name is Required',
            type: 'FIRSTNAME_REQUIRED'
        },
        LASTNAME_REQUIRED: {
            statusCode: 400,
            customMessage: 'Last Name is Required',
            type: 'LASTNAME_REQUIRED'
        },
        PROFILE_INCOMPLETE: {
            statusCode: 400,
            customMessage: 'Please complete your profile',
            type: 'PROFILE_INCOMPLETE'
        },
        LOCATION_REQUIRED: {
            statusCode: 400,
            customMessage: 'Location is Required',
            type: 'LOCATION_REQUIRED'
        },
        CITY_REQUIRED: {
            statusCode: 400,
            customMessage: 'City is Required',
            type: 'City_REQUIRED'
        },
        FOUNDATIONDATE_REQUIRED: {
            statusCode: 400,
            customMessage: 'Foundation date is Required',
            type: 'FOUNDATION_DATE_REQUIRED'
        },
        UNITNAME_REQUIRED: {
            statusCode: 400,
            customMessage: 'Unit Name is Required',
            type: 'UNITNAME_REQUIRED'
        },
        OFFICEADDRESS1_REQUIRED: {
            statusCode: 400,
            customMessage: 'Office Address1 is Required',
            type: 'OFFICEADDRESS1_REQUIRED'
        },
        BANKACCOUNTHOLDERNAME_REQUIRED: {
            statusCode: 400,
            customMessage: 'Bank Account Holder Name is Required',
            type: 'BANKACCOUNTHOLDERNAME_REQUIRED'
        },
        BANKACCOUNTHOLDERPHONE_REQUIRED: {
            statusCode: 400,
            customMessage: 'Bank Account Holder Phone Number is Required',
            type: 'BANKACCOUNTHOLDERPHONE_REQUIRED'
        },
        BANKACCOUNTHOLDERACCNUMBER_REQUIRED: {
            statusCode: 400,
            customMessage: 'Bank Account Holder Account Number is Required',
            type: 'BANKACCOUNTHOLDERACCNUMBER_REQUIRED'
        },
        TYPE_REQUIRED: {
            statusCode: 400,
            customMessage: 'Type of charity is Required',
            type: 'TYPE_OF_CHARITY_REQUIRED'
        },
        COSTPERUNIT_REQUIRED: {
            statusCode: 400,
            customMessage: 'Cost per unit is Required',
            type: 'COSTPERUNIT_REQUIRED'
        },
        DESCRIPTION_REQUIRED: {
            statusCode: 400,
            customMessage: 'Description is Required',
            type: 'DESCRIPTION_REQUIRED'
        },
        TARGETUNITCOUNT_REQUIRED: {
            statusCode: 400,
            customMessage: 'Target for unit count is Required',
            type: 'TARGETUNITCOUNT_REQUIRED'
        },
        RECORD_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Records not found.',
            type: 'RECORD_NOT_FOUND'
        },
        MANAGER_PICK_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Manager pick not found.',
            type: 'MANAGER_PICK_NOT_FOUND'
        },
        MANAGER_FANSPICK_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Manager-pick and fans-pick not found.',
            type: 'MANAGER_FANSPICK_NOT_FOUND'
        },
        USERPICK_MANAGER_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Manager-pick and userpick not found.',
            type: 'USERPICK_MANAGER_NOT_FOUND'
        },
        FANSPICK_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Fanspick not found.',
            type: 'FANSPICK_NOT_FOUND'
        },
        USERPICK_FANSPICK_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Userpick and Fanspick not found.',
            type: 'USERPICK_FANSPICK_NOT_FOUND'
        },
        FANSPICK_INCOMPLETE: {
            statusCode: 400,
            customMessage: 'Fanspick is incomplete',
            type: 'FANSPICK_INCOMPLETE'
        },
        USERPICK_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Userpick not found.',
            type: 'USERPICK_NOT_FOUND'
        },
        SECONDARY_FAV_TEAM: {
            statusCode: 400,
            customMessage: 'Userpick is not available for secondary favourite team',
            type: 'SECONDARY_FAV_TEAM'
        },
        USERPICK_INCOMPLETE: {
            statusCode: 400,
            customMessage: 'Userpick is incomplete.',
            type: 'USERPICK_INCOMPLETE'
        },
        COUNTRY_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Country not found.',
            type: 'COUNTRY_NOT_FOUND'
        },
        SEASON_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Season not found.',
            type: 'SEASON_NOT_FOUND'
        },
        DEFAULT_FAV: {
            statusCode: 400,
            customMessage: 'Primary team can not be deleted',
            type: 'DEFAULT_FAV'
        },
        USERACTION_EXIST: {
            statusCode: 400,
            customMessage: 'You can update action after 15 minutes of previous action',
            type: 'USERACTION_EXIST'
        },
        MAN_OF_THE_MATCH_EXIST: {
            statusCode: 400,
            customMessage: 'Man of the match already selected',
            type: 'MAN_OF_THE_MATCH_EXIST'
        },
        NOT_FOUND_IN_FAVORITE: {
            statusCode: 400,
            customMessage: 'Records not found in favorite list.',
            type: 'NOT_FOUND_IN_FAVORITE'
        },
        CAMPAIGNENDDATE_REQUIRED: {
            statusCode: 400,
            customMessage: 'Campaign end date is Required',
            type: 'CAMPAIGNENDDATE_REQUIRED'
        },
        KEYWORD_REQUIRED: {
            statusCode: 400,
            customMessage: 'Keyword is Required',
            type: 'DESCRIPTION_REQUIRED'
        },
        VIDEO_REQUIRED: {
            statusCode: 400,
            customMessage: 'Video is Required',
            type: 'VIDEO_REQUIRED'
        },
        LOGO_FILE_REQUIRED: {
            statusCode: 400,
            customMessage: 'Logo is Required',
            type: 'LOGO_FILE_REQUIRED'
        },
        TAXID_REQUIRED: {
            statusCode: 400,
            customMessage: 'TAX id Required',
            type: 'TAX_ID_REQUIRED'
        },
        TAXDEDUCTIONCODE_REQUIRED: {
            statusCode: 400,
            customMessage: 'TAX Deduction code Required',
            type: 'TAX_DEDUCTION_CODE_REQUIRED'
        },
        COUNTRY_CODE_MISSING: {
            statusCode: 400,
            customMessage: 'You forgot to enter the country code',
            type: 'COUNTRY_CODE_MISSING'
        },
        INVALID_PHONE_NO: {
            statusCode: 400,
            customMessage: 'Phone No. & Country Code does not match to which the OTP was sent',
            type: 'INVALID_PHONE_NO'
        },
        PHONE_NO_MISSING: {
            statusCode: 400,
            customMessage: 'You forgot to enter the phone no.',
            type: 'PHONE_NO_MISSING'
        },
        PHONE_NOT_REGISTERED: {
            statusCode: 400,
            customMessage: 'Provided number is not registered',
            type: 'PHONE_NOT_REGISTERED'
        },
        NOTHING_TO_UPDATE: {
            statusCode: 400,
            customMessage: 'Nothing to update',
            type: 'NOTHING_TO_UPDATE'
        },
        NOT_FOUND: {
            statusCode: 400,
            customMessage: 'User Not Found',
            type: 'NOT_FOUND'
        },
        CONTACTS_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Contacts Not Found',
            type: 'CONTACTS_NOT_FOUND'
        },
        FIXTURE_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Fixture data Not Found',
            type: 'FIXTURE_NOT_FOUND'
        },
        FORMATION_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Formation Not Found',
            type: 'FORMATION_NOT_FOUND'
        },
        INVALID_RESET_PASSWORD_TOKEN: {
            statusCode: 400,
            customMessage: 'Invalid Reset Password Token',
            type: 'INVALID_RESET_PASSWORD_TOKEN'
        },
        INCORRECT_PASSWORD: {
            statusCode: 400,
            customMessage: 'Incorrect Password',
            type: 'INCORRECT_PASSWORD'
        },
        VALUE_EXIST: {
            statusCode: 400,
            customMessage: 'Value Exist',
            type: 'VALUE_EXIST'
        },
        DUPLICATE_FAVOURITE: {
            statusCode: 400,
            customMessage: 'You can set only one team as favourite from a country',
            type: 'DUPLICATE_FAVOURITE'
        },
        PRIMARY_VALUE_EXIST: {
            statusCode: 400,
            customMessage: 'is already set as Primary Favourite',
            type: 'PRIMARY_VALUE_EXIST'
        },
        SECONDARY_VALUE_EXIST: {
            statusCode: 400,
            customMessage: 'is already set as Secondary Favourite',
            type: 'SECONDARY_VALUE_EXIST'
        },
        PRIMARY_DUPLICATE_ENTERY: {
            statusCode: 400,
            customMessage: 'You can set only one team as Primary Favourite for',
            type: 'PRIMARY_DUPLICATE_ENTERY'
        },
        EMPTY_VALUE: {
            statusCode: 400,
            customMessage: 'Empty String Not Allowed',
            type: 'EMPTY_VALUE'
        },
        PHONE_NOT_MATCH: {
            statusCode: 400,
            customMessage: "Phone No. Doesn't Match",
            type: 'PHONE_NOT_MATCH'
        },
        SAME_PASSWORD: {
            statusCode: 400,
            customMessage: 'Old password and new password are same',
            type: 'SAME_PASSWORD'
        },
        ACTIVE_PREVIOUS_SESSIONS: {
            statusCode: 400,
            customMessage: 'You already have previous active sessions, confirm for flush',
            type: 'ACTIVE_PREVIOUS_SESSIONS'
        },
        ACTIVE_SESSIONS_EXPIRED: {
            statusCode: 401,
            customMessage: 'Your session has been expired',
            type: 'ACTIVE_SESSIONS_EXPIRE'
        },
        EMAIL_ALREADY_EXIST: {
            statusCode: 400,
            customMessage: 'Email Address Already Exists',
            type: 'EMAIL_ALREADY_EXIST'
        },
        COMMUNITY_ALREADY_EXIST: {
            statusCode: 400,
            customMessage: 'Community Already Exists',
            type: 'COMMUNITY_ALREADY_EXIST'
        },
        TOPIC_ALREADY_EXIST: {
            statusCode: 400,
            customMessage: 'Topic Already Exists',
            type: 'TOPIC_ALREADY_EXIST'
        },
        FACEBOOK_ID_EXIST: {
            statusCode: 400,
            customMessage: 'Facebook ID Already Exists',
            type: 'FACEBOOK_ID_EXIST'
        },
        USERNAME_EXIST: {
            statusCode: 400,
            customMessage: 'Username Already Exists',
            type: 'USERNAME_EXIST'
        },
        CHARITYREGNO_ALREADY_EXIST: {
            statusCode: 400,
            customMessage: 'Charity Registration No Already Exists',
            type: 'CHARITYREGNO_ALREADY_EXIST'
        },
        ERROR_PROFILE_PIC_UPLOAD: {
            statusCode: 400,
            customMessage: 'Profile pic is not a valid file',
            type: 'ERROR_PROFILE_PIC_UPLOAD'
        },
        PHONE_ALREADY_EXIST: {
            statusCode: 400,
            customMessage: 'Phone No. Already Exists',
            type: 'PHONE_ALREADY_EXIST'
        },
        CAMPAIGN_EXIST: {
            statusCode: 400,
            customMessage: 'Campaign name already exist.',
            type: 'CAMPAIGN_EXIST'
        },
        EMAIL_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'You are not registered yet.',
            type: 'EMAIL_NOT_FOUND'
        },
        COMMUNITY_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Community not found',
            type: 'COMMUNITY_NOT_FOUND'
        },
        SPORT_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Sport not found',
            type: 'SPORT_NOT_FOUND'
        },
        LEAGUE_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'League not found',
            type: 'LEAGUE_NOT_FOUND'
        },
        LEAGUE_OR_TEAM_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'League or Team not found',
            type: 'LEAGUE_OR_TEAM_NOT_FOUND'
        },
        PROFILE_EXIST: {
            statusCode: 400,
            customMessage: 'Profile Exist, Please use edit profile to edit or change profile data.',
            type: 'PROFILE_EXIST'
        },
        BANK_DETAILS_EXIST: {
            statusCode: 400,
            customMessage: 'Bank Details Exist, Please use edit Bank details to change data.',
            type: 'BANK_DETAILS_EXIST'
        },
        TAGS_LENGTH_EXCEEDED: {
            statusCode: 400,
            customMessage: 'Max 5 tags allowed, Remove old tags or choose less then 5 tags',
            type: 'TAGS_LENGTH_EXCEEDED'
        },
        PICTURE_REQUIRED: {
            statusCode: 400,
            customMessage: 'Please select pictures',
            type: 'PICTURE_REQUIRED'
        },
        FACEBOOK_ID_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Facebook Id Not Found',
            type: 'FACEBOOK_ID_NOT_FOUND'
        },
        PHONE_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Phone No. Not Found',
            type: 'PHONE_NOT_FOUND'
        },
        INCORRECT_OLD_PASS: {
            statusCode: 400,
            customMessage: 'Incorrect Old Password',
            type: 'INCORRECT_OLD_PASS'
        },
        UNAUTHORIZED: {
            statusCode: 401,
            customMessage: 'You are not authorized to perform this action',
            type: 'UNAUTHORIZED'
        },
        PLAYER_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'You are not authorized to perform this action',
            type: 'Player not found'
        },
        USERFIXTURE_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'User Fixture not found',
            type: 'USERFIXTURE_NOT_FOUND'
        },
        SUBTITUTES_NOT_FOUND: {
            statusCode: 400,
            customMessage: 'Subtitutes not found',
            type: 'SUBTITUTES_NOT_FOUND'
        },
        SUBSTITUTE_LIMIT: {
            statusCode: 400,
            customMessage: 'Subtitute limit exceeded',
            type: 'SUBSTITUTE_LIMIT'
        },
        GROUP_NOT_EXIST: {
            statusCode: 400,
            customMessage: 'Group not found',
            type: 'GROUP_NOT_EXIST'
        },
        INCORRECT_OTP: {
            statusCode: 400,
            customMessage: 'OTP does not match',
            type: 'INCORRECT_OTP'
        },
        OTP_EXPIRED: {
            statusCode: 400,
            customMessage: 'OTP is expired',
            type: 'OTP_EXPIRED'
        },
        NOT_AN_ADMIN: {
            statusCode: 400,
            customMessage: 'You are not an admin',
            type: 'NOT_AN_ADMIN'
        },
        NOT_GROUP_MEMBER: {
            statusCode: 400,
            customMessage: 'Not a member of this group',
            type: 'NOT_GROUP_MEMBER'
        },
        USER_ALREADY_EXIST: {
            statusCode: 400,
            customMessage: 'Already a member of group',
            type: 'USER_ALREADY_EXIST'
        }
    },
    SUCCESS: {
        CREATED: {
            statusCode: 201,
            customMessage: 'Created Successfully',
            type: 'CREATED'
        },
        DEFAULT: {
            statusCode: 200,
            customMessage: 'Success',
            type: 'DEFAULT'
        },
        UPDATED: {
            statusCode: 200,
            customMessage: 'Updated Successfully',
            type: 'UPDATED'
        },
        LOGOUT: {
            statusCode: 200,
            customMessage: 'Logged Out Successfully',
            type: 'LOGOUT'
        },
        DELETED: {
            statusCode: 200,
            customMessage: 'Deleted Successfully',
            type: 'DELETED'
        },
        USERACTION_MARKED: {
            statusCode: 200,
            customMessage: 'Action marked successfully',
            type: 'USERACTION_MARKED'
        },
    }
};


var swaggerDefaultResponseMessages = [
    { code: 200, message: 'OK' },
    { code: 400, message: 'Bad Request' },
    { code: 401, message: 'Unauthorized' },
    { code: 404, message: 'Data Not Found' },
    { code: 500, message: 'Internal Server Error' }
];

var SCREEN_TO_SHOW = {
    HOMEPAGE: 'HOMEPAGE',
    TRACKING: 'TRACKING',
    FEEDBACK: 'FEEDBACK'
};

var CAMPAIGN_TYPE = {
    COMPLETE: 'COMPLETE',
    PENDING: 'PENDING'
};

var notificationMessages = {
    verificationCodeMsg: 'Your 4 digit verification code for Fanspick is {{four_digit_verification_code}}',
    registrationEmail: {
        emailMessage: "Dear {{user_name}}, <br><br> Please  <a href='{{verification_url}}'>click here</a> to verify your email address",
        emailSubject: "Welcome to Seed Project"
    },
    contactDriverForm: {
        emailMessage: "A new driver has showed interest <br><br> Details : <br><br> Name : {{fullName}} <br><br> Email : {{email}} <br><br> Phone No : {{phoneNo}} <br><br> Vehicle Type : {{vehicleType}} <br><br> Bank Account : {{bankAccountBoolean}} <br><br> Heard From : {{heardFrom}}",
        emailSubject: "New Driver Contact Request"
    },
    contactBusinessForm: {
        emailMessage: "A new business has showed interest <br><br> Details : <br><br> Name : {{fullName}} <br><br> Email : {{email}} <br><br> Phone No : {{phoneNo}} <br><br> Business Name: {{businessName}} <br><br> Business Address: {{businessAddress}}  <br><br> Delivery Service : {{ownDeliveryService}} <br><br> Heard From : {{heardFrom}}",
        emailSubject: "New Business Contact Request"
    },
    forgotPassword: {
        emailMessage: "Dear {{user_name}}, <br><br>  Your reset password token is <strong>{{password_reset_token}}</strong> , <a href='{{password_reset_link}}'> Click Here </a> To Reset Your Password",
        emailSubject: "Password Reset Notification For Seed Project"
    },
    charityForgotPassword: {
        //emailMessage : "Dear {{user_name}}, <br><br>  Your reset password token is <strong>{{password_reset_token}}</strong> , <a href='{{password_reset_link}}'> Click Here </a> To Reset Your Password",
        emailMessage: "Dear {{user_name}}, <br><br>Please fill password to following link to reset your password. ,<br> <br> {{password_reset_link}}  ",
        emailSubject: "Password Reset Notification For GiveApp"
    }
};

var languageSpecificMessages = {
    verificationCodeMsg: {
        EN: 'Your 4 digit verification code for Seed Project is {{four_digit_verification_code}}',
        ES_MX: 'Your 4 digit verification code for Seed Project is {{four_digit_verification_code}}'
    }
};

var CHAT_TYPE = {
    FANSPICK: 'fanspick',
    COMMUNITY: 'community'
};

var CHAT_GROUP_TYPE = {
    ONE_TO_ONE: 'oneToOne',
    ONE_TO_MANY: 'oneToMany'
};

var OTP_EXPIRATION_TIME = 2;

var STATS_TYPES = {
    SUBSTITUTES: 'substitutes',
    LINE_UP_PLAYERS: 'lineUpPlayers'
}

var EUROPEAN_COUNTRY_NAME = 'European Competitions';

var EUROPEAN_STAGES = {
    GROUP_STAGE: 'Group Stage',
    QUALIFYING: 'Qualifying'
}

var ImageServer = {
    Profile_URL: "wwwroot/Uploads/",
    IP_Address: '78.129.219.241',
    username: 'ftp_fan',
    password: 'LogF@n1'
}

var MESSAGE_TYPE = {
    NOTIFICATION: "Notification",
    MESSAGE: "Message"
}


var APP_CONSTANTS = {
    SERVER: SERVER,
    DATABASE: DATABASE,
    SCREEN_TO_SHOW: SCREEN_TO_SHOW,
    CAMPAIGN_TYPE: CAMPAIGN_TYPE,
    DOMAIN_NAME_MAIL: DOMAIN_NAME_MAIL,
    STATUS_MSG: STATUS_MSG,
    notificationMessages: notificationMessages,
    languageSpecificMessages: languageSpecificMessages,
    swaggerDefaultResponseMessages: swaggerDefaultResponseMessages,
    CHAT_TYPE: CHAT_TYPE,
    CHAT_GROUP_TYPE: CHAT_GROUP_TYPE,
    OTP_EXPIRATION_TIME: OTP_EXPIRATION_TIME,
    STATS_TYPES: STATS_TYPES,
    EUROPEAN_COUNTRY_NAME: EUROPEAN_COUNTRY_NAME,
    EUROPEAN_STAGES: EUROPEAN_STAGES,
    ImageServer: ImageServer,
    MESSAGE_TYPE: MESSAGE_TYPE
};

module.exports = APP_CONSTANTS;