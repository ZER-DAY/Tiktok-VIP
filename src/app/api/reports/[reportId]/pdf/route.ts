import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params;

    const report = await prisma.analysisReport.findUnique({
      where: { id: reportId },
      include: {
        snapshot: {
          include: {
            account: {
              include: {
                provider: true,
              },
            },
          },
        },
        insights: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: { message: "Report not found" } },
        { status: 404 }
      );
    }

    const snapshot = report.snapshot;
    const account = snapshot.account;

    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير تحليل ${account.externalUsername}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Tajawal', sans-serif;
      background: #0B0B14;
      color: white;
      padding: 40px;
      direction: rtl;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      color: #9CA3AF;
      font-size: 14px;
    }
    
    .account-info {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }
    
    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #EC4899, #8B5CF6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
    }
    
    .account-details h2 {
      font-size: 20px;
      margin-bottom: 5px;
    }
    
    .account-details p {
      color: #9CA3AF;
      font-size: 14px;
    }
    
    .score-section {
      text-align: center;
      margin-bottom: 30px;
      padding: 30px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }
    
    .main-score {
      font-size: 64px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .score-label {
      color: #9CA3AF;
      font-size: 16px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      text-align: center;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .stat-label {
      color: #9CA3AF;
      font-size: 12px;
    }
    
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .score-card {
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }
    
    .score-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .score-card-title {
      color: #9CA3AF;
      font-size: 14px;
    }
    
    .score-card-value {
      font-size: 24px;
      font-weight: 700;
    }
    
    .progress-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      border-radius: 4px;
    }
    
    .insights-section {
      margin-bottom: 30px;
    }
    
    .insights-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .insight-card {
      padding: 15px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-bottom: 10px;
    }
    
    .insight-card h4 {
      font-size: 14px;
      margin-bottom: 5px;
    }
    
    .insight-card p {
      color: #9CA3AF;
      font-size: 13px;
    }
    
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #6B7280;
      font-size: 12px;
    }
    
    .estimated-badge {
      display: inline-block;
      background: rgba(234, 179, 8, 0.2);
      color: #EAB308;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      margin-inline-start: 5px;
    }
    
    .score-label-text {
      display: inline-block;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      margin-inline-start: 5px;
    }
    
    .score-label-high {
      background: rgba(34, 197, 94, 0.2);
      color: #22C55E;
    }
    
    .score-label-medium {
      background: rgba(249, 115, 22, 0.2);
      color: #F97316;
    }
    
    .score-label-low {
      background: rgba(239, 68, 68, 0.2);
      color: #EF4444;
    }
    
    @media print {
      body {
        background: white;
        color: black;
      }
      
      .account-info,
      .score-section,
      .stat-card,
      .score-card,
      .insight-card {
        background: #F3F4F6;
      }
      
      .stat-label,
      .score-card-title,
      .insight-card p {
        color: #6B7280;
      }
      
      .estimated-badge {
        border: 1px solid #EAB308;
      }
      
      .score-label-text {
        border: 1px solid currentColor;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>تقرير تحليل TikTok</h1>
    <p class="subtitle">${new Date(report.generatedAt).toLocaleDateString("ar-SA")}</p>
  </div>
  
  <div class="account-info">
    <div class="avatar">${account.externalUsername.charAt(0).toUpperCase()}</div>
    <div class="account-details">
      <h2>@${account.externalUsername}</h2>
      <p>${account.provider.displayName} • ${snapshot.accountType === "business" ? "حساب أعمال" : "حساب شخصي"}</p>
    </div>
  </div>
  
  <div class="score-section">
    <div class="main-score" style="color: ${report.accountStrengthScore >= 70 ? "#22C55E" : report.accountStrengthScore >= 40 ? "#F97316" : "#EF4444"}">${report.accountStrengthScore}</div>
    <div class="score-label">Account Strength Score</div>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${formatNumber(snapshot.followers)}</div>
      <div class="stat-label">المتابعون</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatNumber(snapshot.following)}</div>
      <div class="stat-label">المتابَعون</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatNumber(Number(snapshot.totalLikes))}</div>
      <div class="stat-label">إجمالي الإعجابات</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${snapshot.videoCount}</div>
      <div class="stat-label">الفيديوهات</div>
    </div>
  </div>
  
  <div class="scores-grid">
    <div class="score-card">
      <div class="score-card-header">
        <span class="score-card-title">جودة التفاعل</span>
        <span class="score-card-value" style="color: ${getScoreColor(report.engagementQualityScore)}">${report.engagementQualityScore}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${report.engagementQualityScore}%; background: ${getScoreGradient(report.engagementQualityScore)}"></div>
      </div>
    </div>
    
    <div class="score-card">
      <div class="score-card-header">
        <span class="score-card-title">جودة المحتوى</span>
        <span class="score-card-value" style="color: ${getScoreColor(report.contentQualityScore)}">${report.contentQualityScore}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${report.contentQualityScore}%; background: ${getScoreGradient(report.contentQualityScore)}"></div>
      </div>
    </div>
    
    <div class="score-card">
      <div class="score-card-header">
        <span class="score-card-title">انتظام النشر</span>
        <span class="score-card-value" style="color: ${getScoreColor(report.postingConsistencyScore)}">${report.postingConsistencyScore}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${report.postingConsistencyScore}%; background: ${getScoreGradient(report.postingConsistencyScore)}"></div>
      </div>
    </div>
    
    <div class="score-card">
      <div class="score-card-header">
        <span class="score-card-title">فرص الوصول لـ For You</span>
        <span class="score-card-value" style="color: ${getScoreColor(report.explorePotentialPercent)}">${report.explorePotentialPercent}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${report.explorePotentialPercent}%; background: ${getScoreGradient(report.explorePotentialPercent)}"></div>
      </div>
    </div>
    
    <div class="score-card">
      <div class="score-card-header">
        <span class="score-card-title">قدرة البث المباشر</span>
        <span class="score-card-value" style="color: ${getScoreColor(report.livePotentialScore)}">${report.livePotentialScore}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${report.livePotentialScore}%; background: ${getScoreGradient(report.livePotentialScore)}"></div>
      </div>
    </div>
    
    <div class="score-card">
      <div class="score-card-header">
        <span class="score-card-title">الاحترافية</span>
        <span class="score-card-value" style="color: ${getScoreColor(report.professionalismScore)}">${report.professionalismScore}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${report.professionalismScore}%; background: ${getScoreGradient(report.professionalismScore)}"></div>
      </div>
    </div>
  </div>
  
  ${
    report.insights.length > 0
      ? `
  <div class="insights-section">
    <h3 class="insights-title">
      <span style="color: #22C55E">●</span> نقاط القوة والتوصيات
    </h3>
    ${report.insights
      .map(
        (insight) => `
    <div class="insight-card">
      <h4>${insight.title}</h4>
      <p>${insight.description}</p>
    </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }
  
  <div class="footer">
    <p>تم إنشاء هذا التقرير بواسطة TikTok Analyzer</p>
    <p>ملاحظة: جميع النتائج تقديرية وليست بيانات رسمية من TikTok</p>
  </div>
</body>
</html>
    `;

    // Return HTML that can be printed as PDF
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="report-${account.externalUsername}.html"`,
      },
    });
  } catch (error) {
    console.error("[PDF EXPORT]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to generate PDF" } },
      { status: 500 }
    );
  }
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#22C55E";
  if (score >= 40) return "#F97316";
  return "#EF4444";
}

function getScoreGradient(score: number): string {
  if (score >= 70) return "linear-gradient(90deg, #22C55E, #10B981)";
  if (score >= 40) return "linear-gradient(90deg, #F97316, #F59E0B)";
  return "linear-gradient(90deg, #EF4444, #F43F5E)";
}
