import { NextResponse } from "next/server"

export async function GET() {
  // Create a vCard format string
  const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Ronaldo Katriel Widjaja
N:Doe;John;;;
TITLE:Software Engineer
ORG:Self-employed
EMAIL:john.doe@example.com
TEL;TYPE=CELL:+1234567890
URL:https://johndoe.com
ADR;TYPE=WORK:;;123 Tech Street;San Francisco;CA;94105;USA
END:VCARD`

  // Return the vCard as a downloadable file
  return new NextResponse(vcard, {
    headers: {
      "Content-Type": "text/vcard",
      "Content-Disposition": 'attachment; filename="john-doe.vcf"',
    },
  })
}
