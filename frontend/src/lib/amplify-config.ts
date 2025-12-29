import { Amplify } from 'aws-amplify';

// 環境変数の検証
const userPoolId = import.meta.env.VITE_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;

// ゲストモード対応: 環境変数が未設定の場合は警告のみ表示
if (!userPoolId || !userPoolClientId) {
  console.warn('⚠ Cognito環境変数が設定されていません。ゲストモードで動作します。');
  console.warn('VITE_USER_POOL_ID:', userPoolId || '未設定');
  console.warn('VITE_USER_POOL_CLIENT_ID:', userPoolClientId || '未設定');
  console.warn('\n認証機能を使用するには .env.local ファイルに設定してください。');
  console.warn('設定方法:');
  console.warn('1. cd terraform/environments/dev');
  console.warn('2. terraform output cognito_user_pool_id');
  console.warn('3. terraform output cognito_user_pool_client_id');
  console.warn('4. 取得した値を frontend/.env.local に設定');
} else {
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
}

export default { configured: !!userPoolId && !!userPoolClientId };
