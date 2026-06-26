// src/inngest/client.ts
import { Inngest } from "inngest";
import connectDB from "./db";
import User from "../models/User";

export const inngest = new Inngest({ id: "quickcart-next" });

// Fixed: Triggers moved inside the first argument object
export const syncUserCreation = inngest.createFunction(
    {
        id: 'sync-user-from-clerk',
        triggers: { event: 'clerk/user.created' }  // <-- triggers goes here
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            image_url: image_url
        }
        await connectDB()
        await User.create(userData)
    }
)

export const syncUserUpdation = inngest.createFunction(
    {
        id: 'update-user-from-clerk',
        triggers: { event: 'clerk/user.updated' }  // <-- triggers goes here
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            image_url: image_url
        }
        await connectDB()
        await User.findByIdAndUpdate(id, userData)
    }
)

export const syncUserDeletion = inngest.createFunction(
    {
        id: 'delete-user-with-clerk',
        triggers: { event: 'clerk/user.deleted' }  // <-- triggers goes here
    },
    async ({ event }) => {
        const { id } = event.data 
        await connectDB()
        await User.findByIdAndDelete(id)
    }
)