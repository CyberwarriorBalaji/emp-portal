from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("role")
    await db.otps.create_index("email")
    await db.otps.create_index("expires_at", expireAfterSeconds=0)
    print("✅ Connected to MongoDB")


async def disconnect_db():
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB")


def get_db():
    return db
