import uuid
from pathlib import Path

from app.core.config import get_settings
from app.core.exceptions import BusinessRuleError

_EXTENSIONS = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def detect_image_type(data: bytes) -> str | None:
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


class PhotoStorage:

    def __init__(self, root: str | Path | None = None, max_bytes: int | None = None):
        settings = get_settings()
        self.dir = Path(root or settings.upload_dir) / "cars"
        self.max_bytes = max_bytes or settings.max_photo_bytes

    def save(self, data: bytes) -> str:
        if not data:
            raise BusinessRuleError("The uploaded file is empty")
        if len(data) > self.max_bytes:
            raise BusinessRuleError(f"Photo is too large (max {self.max_bytes // (1024 * 1024)} MB)")
        mime = detect_image_type(data)
        if mime is None:
            raise BusinessRuleError("Unsupported file type. Use JPEG, PNG or WebP")
        self.dir.mkdir(parents=True, exist_ok=True)
        name = f"{uuid.uuid4().hex}{_EXTENSIONS[mime]}"
        (self.dir / name).write_bytes(data)
        return name

    def delete(self, name: str | None) -> None:
        if not name:
            return
        (self.dir / Path(name).name).unlink(missing_ok=True)