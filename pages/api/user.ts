import { NextApiRequest, NextApiResponse } from "next";
import { AuthService } from "../../service/auth.service";
import { UserService } from "../../service/user.service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const userService = new UserService(req)
  const authService = new AuthService(req, res)

  if (req.method === 'PUT') {
   // 1. Update the destructuring at the top of the handler
const { 
  displayName, 
  notificationEmail, 
  enableCommentNotifications // RENAME THIS from enableNewCommentNotification
} = req.body

// ... some code ...

// 2. Update the call to the user service (Line 28)
await userService.update(user.uid, {
  enableCommentNotifications, // RENAME THIS from enableNewCommentNotification
  notificationEmail,
  displayName
})

    res.json({
      message: 'success'
    })
  }
}
