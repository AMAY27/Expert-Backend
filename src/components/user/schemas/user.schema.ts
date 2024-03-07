import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Date, Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    validate: {
      validator: async function (value: string) {
        const user = await this.constructor.findOne({ email: value });
        return !user;
      },
      message: 'Email already exists',
    },
  })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  subscription: string;

  @Prop({ default: Date.now, type: Date })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
