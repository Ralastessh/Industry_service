from .session import engine
from .tables import Base

def init_db():
    Base.metadata.create_all(bind=engine)