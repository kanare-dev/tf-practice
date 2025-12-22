import json
import os
import boto3
from datetime import datetime

# DynamoDBクライアント
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name) if table_name else None

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        },
        "body": json.dumps(body)
    }

def handler(event, context):
    method = event.get("httpMethod")
    path = event.get("path", "")

    # Cognito認証からuserIdを取得（API Gateway Authorizerが検証済み）
    try:
        user_id = event['requestContext']['authorizer']['claims']['sub']
    except (KeyError, TypeError):
        # 後方互換性のためdummy-userを使用（本番環境では削除を推奨）
        user_id = "dummy-user"
        print("Warning: No Cognito claims found, using dummy-user for backward compatibility")

    # CORS プリフライトリクエスト対応
    if method == "OPTIONS":
        return response(200, {})

    # 一覧取得
    if method == "GET" and path == "/notes":
        items = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('userId').eq(user_id)
        ).get('Items', [])
        return response(200, {"notes": items})

    # 新規作成
    elif method == "POST" and path == "/notes":
        body = json.loads(event.get('body', '{}'))
        import uuid
        note_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + 'Z'  # UTCであることを明示
        item = {
            "userId": user_id,
            "noteId": note_id,
            "title": body.get("title", ""),
            "content": body.get("content", ""),
            "createdAt": now,
            "updatedAt": now
        }
        table.put_item(Item=item)
        return response(201, {"item": item})

    # ノート取得
    elif method == "GET" and path.startswith("/notes/"):
        note_id = path.split("/notes/")[-1]
        result = table.get_item(Key={"userId": user_id, "noteId": note_id})
        item = result.get("Item")
        if item:
            return response(200, item)
        else:
            return response(404, {"error": "Not found"})

    # ノート更新
    elif method == "PUT" and path.startswith("/notes/"):
        note_id = path.split("/notes/")[-1]
        body = json.loads(event.get('body', '{}'))
        now = datetime.utcnow().isoformat() + 'Z'  # UTCであることを明示
        result = table.update_item(
            Key={"userId": user_id, "noteId": note_id},
            UpdateExpression="SET #t = :title, #c = :content, #u = :u",
            ExpressionAttributeNames={"#t": "title", "#c": "content", "#u": "updatedAt"},
            ExpressionAttributeValues={
                ":title": body.get("title", ""),
                ":content": body.get("content", ""),
                ":u": now,
            },
            ReturnValues="ALL_NEW"
        )
        return response(200, result.get("Attributes"))

    # ノート削除
    elif method == "DELETE" and path.startswith("/notes/"):
        note_id = path.split("/notes/")[-1]
        table.delete_item(Key={"userId": user_id, "noteId": note_id})
        return response(204, {})

    else:
        return response(404, {"error": "Not Found"})

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
            'createdAt': datetime.utcnow().isoformat() + 'Z'  # UTCであることを明示
        }
        
        table.put_item(Item=item)
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps(item)
        }
    except Exception as e:
        raise e

