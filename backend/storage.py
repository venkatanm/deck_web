from minio import Minio
from minio.error import S3Error
import os, io, uuid

BUCKET = os.environ["MINIO_BUCKET"]
PUBLIC_URL = os.environ.get("MINIO_PUBLIC_URL", "http://localhost:9000")

client = Minio(
    os.environ["MINIO_ENDPOINT"],
    access_key=os.environ["MINIO_ACCESS_KEY"],
    secret_key=os.environ["MINIO_SECRET_KEY"],
    secure=os.environ.get("MINIO_SECURE", "false") == "true"
)

def ensure_bucket():
    import time
    import json
    for attempt in range(5):
        try:
            if not client.bucket_exists(BUCKET):
                client.make_bucket(BUCKET)
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"AWS": ["*"]},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{BUCKET}/*"]
                    }]
                }
                client.set_bucket_policy(BUCKET, json.dumps(policy))
            break
        except Exception:
            if attempt < 4:
                time.sleep(2)
            else:
                raise

def upload_file(
    file_bytes: bytes,
    filename: str,
    content_type: str,
    user_id: str
) -> tuple[str, str]:
    """
    Upload file to MinIO.
    Returns (minio_key, public_url).
    """
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    key = f"images/{user_id}/{uuid.uuid4()}.{ext}"
    client.put_object(
        BUCKET, key,
        io.BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type
    )
    url = f"{PUBLIC_URL.rstrip('/')}/{BUCKET}/{key}"
    return key, url

def delete_file(minio_key: str):
    try:
        client.remove_object(BUCKET, minio_key)
    except S3Error:
        pass  # non-fatal
