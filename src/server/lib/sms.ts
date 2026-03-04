import * as tencentcloud from "tencentcloud-sdk-nodejs";

const SmsClient = tencentcloud.sms.v20210111.Client;
type SendSmsParams = Parameters<InstanceType<typeof SmsClient>["SendSms"]>[0];
const isDevelopment = process.env.NODE_ENV !== "production";

const isDevSendSmsEnabled = () => {
  const rawValue = process.env.DEV_SEND_SMS ?? process.env["dev-send-sms"] ?? "false";
  return rawValue.toLowerCase() === "true";
};

const client = new SmsClient({
  credential: {
    secretId: process.env.TENCENT_CLOUD_SECRET_ID || "",
    secretKey: process.env.TENCENT_CLOUD_SECRET_KEY || "",
  },
  region: process.env.TENCENT_SMS_REGION || "ap-guangzhou",
  profile: {
    signMethod: "HmacSHA256",
    httpProfile: {
      reqMethod: "POST",
      reqTimeout: 30,
      endpoint: "sms.tencentcloudapi.com",
    },
  },
});

export async function sendSms(phoneNumber: string, code: string) {
  if (isDevelopment && !isDevSendSmsEnabled()) {
    console.info(`[SMS OTP][DEV] phone=${phoneNumber} code=${code}`);
    return { success: true };
  }

  const appId = process.env.TENCENT_SMS_SDK_APP_ID;
  const signName = process.env.TENCENT_SMS_SIGN_NAME;
  const templateId = process.env.TENCENT_SMS_TEMPLATE_ID;

  if (!appId || !signName || !templateId) {
    return { success: false, error: "SMS configuration is missing" };
  }

  const params: SendSmsParams = {
    SmsSdkAppId: appId,
    SignName: signName,
    TemplateId: templateId,
    TemplateParamSet: [code],
    PhoneNumberSet: [`+86${phoneNumber}`], // Assuming CN numbers for now
  };

  try {
    const result = await client.SendSms(params);
    // Check if the first status is success
    if (result.SendStatusSet?.[0]?.Code === "Ok") {
      return { success: true };
    }
    return {
      success: false,
      error: result.SendStatusSet?.[0]?.Message || "Unknown error",
    };
  } catch (error) {
    console.error("SMS Send Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}
