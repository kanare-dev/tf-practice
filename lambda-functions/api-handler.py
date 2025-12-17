import json
import os
import boto3
from datetime import datetime

# DynamoDBクライアント
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name) if table_name else None

def handler(event, context):
    """
    API Gateway Lambda統合用のハンドラー
    """
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    # CORSヘッダー
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    # OPTIONSリクエスト（CORSプリフライト）
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # ルートパス
        if path == '/' or path == '':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'message': 'Welcome to MVP API',
                    'timestamp': datetime.utcnow().isoformat(),
                    'version': '1.0.0'
                })
            }
        
        # /users エンドポイント
        if path.startswith('/users'):
            if http_method == 'GET':
                return get_users(event, headers)
            elif http_method == 'POST':
                return create_user(event, headers)
        
        # 404 Not Found
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Not Found'})
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Internal Server Error', 'message': str(e)})
        }

def get_users(event, headers):
    """ユーザー一覧を取得"""
    try:
        # クエリパラメータからuserIdを取得
        query_params = event.get('queryStringParameters') or {}
        user_id = query_params.get('userId')
        
        if user_id:
            # 特定ユーザーの取得
            response = table.get_item(Key={'userId': user_id})
            if 'Item' in response:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(response['Item'])
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'User not found'})
                }
        else:
            # 全ユーザーの取得（スキャン）
            response = table.scan()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(response.get('Items', []))
            }
    except Exception as e:
        raise e

def create_user(event, headers):
    """ユーザーを作成"""
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        # ユーザー情報を保存
        item = {
            'userId': user_id,
            'email': body.get('email', ''),
            'name': body.get('name', ''),
            'createdAt': datetime.utcnow().isoformat()
        }
        
        table.put_item(Item=item)
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps(item)
        }
    except Exception as e:
        raise e

