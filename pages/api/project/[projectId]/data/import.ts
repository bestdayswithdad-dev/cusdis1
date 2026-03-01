import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { DataService } from '../../../../../service/data.service'
import * as fs from 'fs'
import { AuthService } from '../../../../../service/auth.service'
import { ProjectService } from '../../../../../service/project.service'

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

    // 1. Fetch project using 'userId' (Prisma's internal mapping for owner_id)
    const project = await projectService.get(projectId, {
      select: {
        userId: true, 
      },
    })

    // 2. Validate ownership (This fixes the 'Forbidden' redirect)
    if (!(await authService.projectOwnerGuard(project as any))) {
      return
    }

    // 3. Process the file import
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(503).json({
          message: err.message,
        })
        return
      }

      // Handle formidable v1 vs v2 file path properties safely
      // @ts-ignore
      const file = files.file || files.files
      // @ts-ignore
      const filePath = file.path || file.filepath
      
      if (!filePath) {
        res.status(400).json({ message: "No file uploaded" })
        return
      }

      try {
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
      } catch (importErr: any) {
        res.status(500).json({ message: importErr.message })
      }
    })
  } else {
    res.status(405).json({ message: "Method not allowed" })
  }
}
