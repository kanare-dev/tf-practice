variable "api_name" {
  description = "API Gateway名"
  type        = string
}

variable "api_description" {
  description = "API Gatewayの説明"
  type        = string
  default     = ""
}

variable "stage_name" {
  description = "API Gatewayステージ名"
  type        = string
  default     = "dev"
}

variable "endpoint_type" {
  description = "エンドポイントタイプ（REGIONAL, EDGE, PRIVATE）"
  type        = string
  default     = "REGIONAL"
}

variable "lambda_invoke_arn" {
  description = "Lambda関数の呼び出しARN"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda関数名"
  type        = string
}

variable "authorization_type" {
  description = "認証タイプ（NONE, AWS_IAM, COGNITO_USER_POOLS, CUSTOM）"
  type        = string
  default     = "NONE"
}

variable "authorizer_id" {
  description = "認証者のID（オプション）"
  type        = string
  default     = null
}

variable "enable_metrics" {
  description = "CloudWatchメトリクスを有効化するか"
  type        = bool
  default     = true
}

variable "logging_level" {
  description = "ログレベル（OFF, ERROR, INFO）"
  type        = string
  default     = "INFO"
}

variable "tags" {
  description = "リソースに付与するタグ"
  type        = map(string)
  default     = {}
}

# レート制限設定
variable "enable_throttling" {
  description = "スロットリング（レート制限）を有効化するか"
  type        = bool
  default     = false
}

variable "throttle_burst_limit" {
  description = "バースト時の最大リクエスト数"
  type        = number
  default     = 100
}

variable "throttle_rate_limit" {
  description = "1秒あたりの平均リクエスト数"
  type        = number
  default     = 50
}

variable "quota_limit" {
  description = "期間あたりの最大リクエスト数（0で無制限）"
  type        = number
  default     = 10000
}

variable "quota_period" {
  description = "クォータ期間（DAY, WEEK, MONTH）"
  type        = string
  default     = "DAY"
}

