variable "bucket_name" {
  description = "S3バケット名"
  type        = string
}

variable "enable_versioning" {
  description = "バケットバージョニングを有効化するか"
  type        = bool
  default     = true
}

variable "enable_static_hosting" {
  description = "静的Webサイトホスティングを有効化するか"
  type        = bool
  default     = true
}

variable "block_public_acls" {
  description = "パブリックACLをブロックするか"
  type        = bool
  default     = false
}

variable "block_public_policy" {
  description = "パブリックポリシーをブロックするか"
  type        = bool
  default     = false
}

variable "ignore_public_acls" {
  description = "パブリックACLを無視するか"
  type        = bool
  default     = false
}

variable "restrict_public_buckets" {
  description = "パブリックバケットアクセスを制限するか"
  type        = bool
  default     = false
}

variable "create_lambda_deployment_bucket" {
  description = "Lambdaデプロイパッケージ用のS3バケットを作成するか"
  type        = bool
  default     = true
}

variable "tags" {
  description = "リソースに付与するタグ"
  type        = map(string)
  default     = {}
}

