import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { DataService } from '../../../../../service/data.service'
import * as fs from 'fs'
import { AuthService } from '../../../../../service/auth.service'
import { ProjectService } from '../../../../../service/project.service'
import { Project } from '@prisma/client'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const authService = new AuthService(req, res)
  const projectService = new ProjectService(req)

  if (req.method === 'POST') {
    const form = new formidable.IncomingForm()
    const dataService = new DataService()

    const { projectId } = req.query as {
      projectId: string
    }

  // SELECTING the actual column name from your Supabase table
    const project = await projectService.get(projectId, {
      select: {
        owner_id: true, // This matches your physical Supabase column
      },
    })

    // Ensuring the guard sees 'owner_id' as the authorized user
    if (!(await authService.projectOwnerGuard(project as any))) {
      // This is where you are getting redirected to forbidden.json
      return
    }

      // @ts-ignore - handling formidable v1 vs v2 file path property
      const filePath = files.file.path || files.file.filepath
      
      const imported = await dataService.importFromDisqus(
        projectId,
        fs.readFileSync(filePath, { encoding: 'utf-8' }),
      )

      res.json({
        data: {
          pageCount: imported.threads.length,
          commentCount: imported.posts.length,
        },
      })
    })
  }
}
