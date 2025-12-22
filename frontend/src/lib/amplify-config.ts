import { Amplify } from 'aws-amplify';

// 環境変数の検証
const userPoolId = import.meta.env.VITE_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;

if (!userPoolId || !userPoolClientId) {
  console.error('❌ Cognito環境変数が設定されていません:');
  console.error('VITE_USER_POOL_ID:', userPoolId || '未設定');
  console.error('VITE_USER_POOL_CLIENT_ID:', userPoolClientId || '未設定');
  console.error('\n.env.localファイルを確認してください。');
  console.error('設定方法:');
  console.error('1. cd terraform/environments/dev');
  console.error('2. terraform output cognito_user_pool_id');
  console.error('3. terraform output cognito_user_pool_client_id');
  console.error('4. 取得した値を frontend/.env.local に設定');
  
  throw new Error('Cognito User Pool configuration is missing. Check .env.local file.');
}

console.log('✓ Cognito設定が読み込まれました');
console.log('User Pool ID:', userPoolId);
console.log('Region:', userPoolId.split('_')[0]);

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
    },
  },
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;
