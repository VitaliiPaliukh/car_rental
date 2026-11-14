class NotFoundError(Exception):
    """Сутність не знайдена -> HTTP 404."""


class BusinessRuleError(Exception):
    """Порушено бізнес-правило / некоректні дані -> HTTP 400."""


class ConflictError(Exception):
    """Конфлікт стану (авто зайняте, дати перетинаються) -> HTTP 409."""


class InvalidStateError(ConflictError):
    """Дія недопустима в поточному стані оренди -> HTTP 409."""