import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

const SHEET_ID = process.env.GOOGLE_SHEET_ID
const SHEET_INDEX = 0

export async function getSheet() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  const jwt = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })
  const doc = new GoogleSpreadsheet(SHEET_ID, jwt)
  await doc.loadInfo()
  return doc.sheetsByIndex[SHEET_INDEX]
}