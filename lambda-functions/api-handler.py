import json
import os
import boto3
from datetime import datetime
import uuid

# DynamoDB クライアント
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'NotesTable-prod')
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    API Gatewayからのリクエストを処理するLambda関数
    Cognito認証済みのユーザーIDを取得し、DynamoDBでノートを管理
    """
    print(f"Event: {json.dumps(event)}")

    # Cognito認証情報からuserIdを取得
    user_id = get_user_id(event)
    if not user_id:
        return response(401, {"error": "Unauthorized: No user ID found"})

    # HTTPメソッドとパスを取得
    method = event.get("httpMethod")
    path = event.get("path", "")

    try:
        # ルーティング
        if method == "GET" and path == "/notes":
            return list_notes(user_id)
        elif method == "POST" and path == "/notes":
            return create_note(user_id, event)
        elif method == "GET" and path.startswith("/notes/"):
            note_id = path.split("/notes/")[-1]
            return get_note(user_id, note_id)
        elif method == "PUT" and path.startswith("/notes/"):
            note_id = path.split("/notes/")[-1]
            return update_note(user_id, note_id, event)
        elif method == "DELETE" and path.startswith("/notes/"):
            note_id = path.split("/notes/")[-1]
            return delete_note(user_id, note_id)
        else:
            return response(404, {"error": "Not found"})
    except Exception as e:
        print(f"Error: {str(e)}")
        return response(500, {"error": "Internal server error", "message": str(e)})

def get_user_id(event):
    """
    Cognito認証情報からuserIdを取得
    API GatewayのCognito Authorizerが設定したrequestContextから取得
    """
    request_context = event.get("requestContext", {})
    authorizer = request_context.get("authorizer", {})

    # Cognito User Pool Authorizerの場合
    claims = authorizer.get("claims", {})
    user_id = claims.get("sub") or claims.get("cognito:username")

    return user_id

def list_notes(user_id):
    """ノート一覧を取得"""
    result = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('userId').eq(user_id)
    )

    notes = result.get('Items', [])
    # 更新日時でソート（新しい順）
    notes.sort(key=lambda x: x.get('updatedAt', ''), reverse=True)

    return response(200, {"notes": notes})

def create_note(user_id, event):
    """新規ノートを作成"""
    body = json.loads(event.get("body", "{}"))

    title = body.get("title", "")
    content = body.get("content", "")

    if not title:
        return response(400, {"error": "Title is required"})

    note_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"

    item = {
        "userId": user_id,
        "noteId": note_id,
        "title": title,
        "content": content,
        "createdAt": now,
        "updatedAt": now
    }

    table.put_item(Item=item)

    return response(201, {"note": item})

def get_note(user_id, note_id):
    """特定のノートを取得"""
    result = table.get_item(
        Key={
            "userId": user_id,
            "noteId": note_id
        }
    )

    if "Item" not in result:
        return response(404, {"error": "Note not found"})

    return response(200, {"note": result["Item"]})

def update_note(user_id, note_id, event):
    """ノートを更新"""
    body = json.loads(event.get("body", "{}"))

    title = body.get("title")
    content = body.get("content")

    if title is None and content is None:
        return response(400, {"error": "Title or content is required"})

    # まずノートが存在するか確認
    existing = table.get_item(
        Key={
            "userId": user_id,
            "noteId": note_id
        }
    )

    if "Item" not in existing:
        return response(404, {"error": "Note not found"})

    # 更新式を構築
    update_expression = "SET updatedAt = :updatedAt"
    expression_values = {
        ":updatedAt": datetime.utcnow().isoformat() + "Z"
    }

    if title is not None:
        update_expression += ", title = :title"
        expression_values[":title"] = title

    if content is not None:
        update_expression += ", content = :content"
        expression_values[":content"] = content

    result = table.update_item(
        Key={
            "userId": user_id,
            "noteId": note_id
        },
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values,
        ReturnValues="ALL_NEW"
    )

    return response(200, {"note": result["Attributes"]})

def delete_note(user_id, note_id):
    """ノートを削除"""
    # まずノートが存在するか確認
    existing = table.get_item(
        Key={
            "userId": user_id,
            "noteId": note_id
        }
    )

    if "Item" not in existing:
        return response(404, {"error": "Note not found"})

    table.delete_item(
        Key={
            "userId": user_id,
            "noteId": note_id
        }
    )

    return response(200, {"message": "Note deleted successfully"})

def response(status_code, body):
    """API Gatewayレスポンスを構築"""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
        "body": json.dumps(body, ensure_ascii=False)
    }

