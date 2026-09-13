import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return Response.json({ user: null });
    }

    await dbConnect();
    const user = await User.findById(session.userId).select('-passwordHash');
    if (!user) {
      return Response.json({ user: null });
    }

    return Response.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    return Response.json({ user: null });
  }
}
