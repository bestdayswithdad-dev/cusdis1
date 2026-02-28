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

    // FIXED: Standardized to 'userId' and used 'as any' to satisfy the compiler
    const project = (await projectService.get(projectId, {
      select: {
        userId: true, 
      },
    })) as any

    if (!(await authService.projectOwnerGuard(project))) {
      return
    }

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(503)
        res.json({
          message: err.message,
        })
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
