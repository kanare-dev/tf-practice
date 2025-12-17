variable "user_pool_name" {
  description = "Cognito User Pool名"
  type        = string
}

variable "user_pool_client_name" {
  description = "Cognito User Pool Client名"
  type        = string
  default     = "web-app-client"
}

variable "password_min_length" {
  description = "パスワードの最小長"
  type        = number
  default     = 8
}

variable "password_require_lowercase" {
  description = "パスワードに小文字を含める必要があるか"
  type        = bool
  default     = true
}

variable "password_require_uppercase" {
  description = "パスワードに大文字を含める必要があるか"
  type        = bool
  default     = true
}

variable "password_require_numbers" {
  description = "パスワードに数字を含める必要があるか"
  type        = bool
  default     = true
}

variable "password_require_symbols" {
  description = "パスワードに記号を含める必要があるか"
  type        = bool
  default     = false
}

variable "username_attributes" {
  description = "ユーザー名属性（email, phone_numberなど）"
  type        = list(string)
  default     = ["email"]
}

variable "auto_verified_attributes" {
  description = "自動検証する属性"
  type        = list(string)
  default     = ["email"]
}

variable "mfa_configuration" {
  description = "MFA設定（OFF, ON, OPTIONAL）"
  type        = string
  default     = "OPTIONAL"
}

variable "generate_secret" {
  description = "クライアントシークレットを生成するか"
  type        = bool
  default     = false
}

variable "explicit_auth_flows" {
  description = "認証フローのリスト"
  type        = list(string)
  default = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

variable "prevent_user_existence_errors" {
  description = "ユーザー存在エラーを防ぐか（ENABLED推奨）"
  type        = string
  default     = "ENABLED"
}

variable "enable_token_revocation" {
  description = "トークン取り消しを有効化するか"
  type        = bool
  default     = true
}

variable "access_token_validity" {
  description = "アクセストークンの有効期限（時間）"
  type        = number
  default     = 1
}

variable "id_token_validity" {
  description = "IDトークンの有効期限（時間）"
  type        = number
  default     = 1
}

variable "refresh_token_validity" {
  description = "リフレッシュトークンの有効期限（日数）"
  type        = number
  default     = 30
}

variable "access_token_validity_unit" {
  description = "アクセストークンの有効期限の単位"
  type        = string
  default     = "hours"
}

variable "id_token_validity_unit" {
  description = "IDトークンの有効期限の単位"
  type        = string
  default     = "hours"
}

variable "refresh_token_validity_unit" {
  description = "リフレッシュトークンの有効期限の単位"
  type        = string
  default     = "days"
}

variable "callback_urls" {
  description = "OAuthコールバックURL"
  type        = list(string)
  default     = []
}

variable "logout_urls" {
  description = "ログアウトURL"
  type        = list(string)
  default     = []
}

variable "allowed_oauth_flows_user_pool_client" {
  description = "OAuthフローを有効化するか"
  type        = bool
  default     = true
}

variable "allowed_oauth_scopes" {
  description = "許可するOAuthスコープ"
  type        = list(string)
  default = [
    "openid",
    "email",
    "profile"
  ]
}

variable "supported_identity_providers" {
  description = "サポートするアイデンティティプロバイダー"
  type        = list(string)
  default     = ["COGNITO"]
}

variable "lambda_config" {
  description = "Lambdaトリガー設定"
  type = object({
    pre_sign_up                    = optional(string)
    pre_authentication             = optional(string)
    post_authentication            = optional(string)
    post_confirmation              = optional(string)
    define_auth_challenge          = optional(string)
    create_auth_challenge          = optional(string)
    verify_auth_challenge_response = optional(string)
  })
  default = null
}

variable "tags" {
  description = "リソースに付与するタグ"
  type        = map(string)
  default     = {}
}

