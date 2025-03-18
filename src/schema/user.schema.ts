import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Role } from "../enum/roles.enum";
import { Document } from "mongoose";


export type UserDocument = User & Document;


@Schema({ timestamps: true })
export class User {
    @Prop({
        required: true,
    })
    first_name: string;

    @Prop({
        required: true
    })
    last_name: string;

    @Prop({
        required: true,
        unique: true
    })
    email: string;

    @Prop({
        required: true,
        default: Role.USER,
        enum: Role
    })
    role: Role;

    @Prop({
        required: true
    })
    hash: string;

    @Prop({
        required: true
    })
    user_img: string;

    @Prop({
        default: false,
    })
    is_verified: boolean;

    @Prop({
        required: true,
        default: true,
    })
    is_active: boolean;


    @Prop()
    otp: string;

    @Prop()
    otp_expires_at: Date;
}


export const UserSchema = SchemaFactory.createForClass(User);