terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = var.user_pool_name

  # パスワードポリシー
  password_policy {
    minimum_length    = var.password_min_length
    require_lowercase = var.password_require_lowercase
    require_uppercase = var.password_require_uppercase
    require_numbers   = var.password_require_numbers
    require_symbols   = var.password_require_symbols
  }

  # ユーザー名設定
  username_attributes      = var.username_attributes
  auto_verified_attributes = var.auto_verified_attributes

  # 多要素認証
  mfa_configuration = var.mfa_configuration

  # タグ
  tags = var.tags

  # Lambdaトリガー
  dynamic "lambda_config" {
    for_each = var.lambda_config != null ? [var.lambda_config] : []
    content {
      pre_sign_up                = try(lambda_config.value.pre_sign_up, null)
      pre_authentication         = try(lambda_config.value.pre_authentication, null)
      post_authentication        = try(lambda_config.value.post_authentication, null)
      post_confirmation          = try(lambda_config.value.post_confirmation, null)
      define_auth_challenge      = try(lambda_config.value.define_auth_challenge, null)
      create_auth_challenge      = try(lambda_config.value.create_auth_challenge, null)
      verify_auth_challenge_response = try(lambda_config.value.verify_auth_challenge_response, null)
    }
  }
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name         = var.user_pool_client_name
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = var.generate_secret
  explicit_auth_flows                  = var.explicit_auth_flows
  prevent_user_existence_errors        = var.prevent_user_existence_errors
  enable_token_revocation              = var.enable_token_revocation
  token_validity_units {
    access_token  = var.access_token_validity_unit
    id_token      = var.id_token_validity_unit
    refresh_token = var.refresh_token_validity_unit
  }
  access_token_validity  = var.access_token_validity
  id_token_validity      = var.id_token_validity
  refresh_token_validity = var.refresh_token_validity

  # コールバックURL
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls
  allowed_oauth_flows_user_pool_client = var.allowed_oauth_flows_user_pool_client
  allowed_oauth_scopes                 = var.allowed_oauth_scopes
  supported_identity_providers         = var.supported_identity_providers
}

