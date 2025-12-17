variable "table_name" {
  description = "DynamoDBテーブル名"
  type        = string
}

variable "hash_key" {
  description = "ハッシュキー（パーティションキー）の属性名"
  type        = string
}

variable "hash_key_type" {
  description = "ハッシュキーの型（S, N, B）"
  type        = string
  default     = "S"
}

variable "range_key" {
  description = "レンジキー（ソートキー）の属性名（オプション）"
  type        = string
  default     = null
}

variable "range_key_type" {
  description = "レンジキーの型（S, N, B）"
  type        = string
  default     = "S"
}

variable "billing_mode" {
  description = "課金モード（PROVISIONED または PAY_PER_REQUEST）"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "read_capacity" {
  description = "読み取りキャパシティユニット（PROVISIONEDモードの場合）"
  type        = number
  default     = 5
}

variable "write_capacity" {
  description = "書き込みキャパシティユニット（PROVISIONEDモードの場合）"
  type        = number
  default     = 5
}

variable "enable_point_in_time_recovery" {
  description = "ポイントインタイムリカバリを有効化するか"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "KMSキーARN（暗号化用、オプション）"
  type        = string
  default     = null
}

variable "tags" {
  description = "リソースに付与するタグ"
  type        = map(string)
  default     = {}
}

