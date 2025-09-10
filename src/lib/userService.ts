import { Db, Collection, ObjectId } from 'mongodb';
import connectToDatabase from './mongodb';

/*
Purpose: User service for PaySkill app. Provides database operations for user management
using native MongoDB driver. Handles user creation, retrieval, and login time tracking
without Mongoose dependencies.
*/

export interface IUser {
  _id?: ObjectId;
  phone: string;
  loginTimes: Date[];
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  private static async getUserCollection(): Promise<Collection<IUser>> {
    const { db } = await connectToDatabase();
    return db.collection<IUser>('users');
  }

  static async findUserByPhone(phone: string): Promise<IUser | null> {
    const collection = await this.getUserCollection();
    return await collection.findOne({ phone });
  }

  static async createUser(phone: string): Promise<IUser> {
    const collection = await this.getUserCollection();
    const now = new Date();
    
    const newUser: Omit<IUser, '_id'> = {
      phone,
      loginTimes: [now],
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(newUser);
    return {
      _id: result.insertedId,
      ...newUser
    };
  }

  static async addLoginTime(phone: string): Promise<IUser> {
    const collection = await this.getUserCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      { phone },
      { 
        $push: { loginTimes: now },
        $set: { updatedAt: now }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('User not found');
    }

    return result;
  }

  static async findOrCreateAndAddLoginTime(phone: string): Promise<IUser> {
    // Validate phone number
    if (!phone || !/^\d{10}$/.test(phone)) {
      throw new Error('Phone number must be exactly 10 digits');
    }

    const existingUser = await this.findUserByPhone(phone);
    
    if (existingUser) {
      // User exists, add new login time
      return await this.addLoginTime(phone);
    } else {
      // User doesn't exist, create new user with first login time
      return await this.createUser(phone);
    }
  }

  static async countUsers(): Promise<number> {
    const collection = await this.getUserCollection();
    return await collection.countDocuments();
  }

  static async getSampleUsers(limit: number = 3): Promise<IUser[]> {
    const collection = await this.getUserCollection();
    return await collection
      .find({}, { projection: { phone: 1, loginTimes: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  static async createIndexes(): Promise<void> {
    const collection = await this.getUserCollection();
    
    // Create index on phone for faster queries
    await collection.createIndex({ phone: 1 }, { unique: true });
  }
}
