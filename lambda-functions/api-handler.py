import json

def handler(event, context):
    # シンプルなAPIディスパッチ例・今後拡張用
    method = event.get("httpMethod")
    path = event.get("path", "")

    if method == "GET" and path == "/notes":
        return response(200, {"message": "ノート一覧取得 (仮)"})
    elif method == "POST" and path == "/notes":
        return response(201, {"message": "ノート新規作成 (仮)"})
    elif method == "GET" and path.startswith("/notes/"):
        note_id = path.split("/notes/")[-1]
        return response(200, {"message": f"ノート取得（仮）: {note_id}"})
    elif method == "PUT" and path.startswith("/notes/"):
        note_id = path.split("/notes/")[-1]
        return response(200, {"message": f"ノート更新（仮）: {note_id}"})
    elif method == "DELETE" and path.startswith("/notes/"):
        note_id = path.split("/notes/")[-1]
        return response(200, {"message": f"ノート削除（仮）: {note_id}"})
    else:
        return response(404, {"error": "not found"})

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }

