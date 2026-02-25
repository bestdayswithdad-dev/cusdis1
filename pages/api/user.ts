import { UserService } from "../../service/user.service";
import { getSession } from "../../utils.server";

export default async function handler(req, res) {
  // 1. Get the session to find the 'user'
  const session = await getSession(req);
  if (!session) {
    return res.status(401).send("Unauthorized");
  }

  const userService = new UserService(req);

  // 2. Correctly destructure the renamed field
  const { 
    displayName, 
    notificationEmail, 
    enableCommentNotifications 
  } = req.body;

  // 3. Use 'session.uid' instead of the missing 'user.uid'
  await userService.update(session.uid, {
    enableCommentNotifications,
    notificationEmail,
    displayName
  });

  return res.status(200).json({ success: true });
}
    res.json({
      message: 'success'
    })
  }
}
