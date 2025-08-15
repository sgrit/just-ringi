document.addEventListener('DOMContentLoaded', function() {
    // 初期ロード時に稟議番号の入力欄にフォーカスを当てる
    document.getElementById('ringi-number').focus();
});
document.getElementById('submit').addEventListener('click', handleSubmit);
document.getElementById('ringi-number').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        handleSubmit();
    }
});

async function handleSubmit() {
  const ringiNumber = document.getElementById('ringi-number').value;
  if (!ringiNumber) {
    alert('稟議番号/申請IDを入力して下さい');
    return;
  }

  try {
    // ユーザー情報取得（primary_group が必要）
    const loginUserUrl = 'https://ssl.wf.jobcan.jp/api/v1/login_user/';
    const loginUserRes = await fetch(loginUserUrl);
    if (!loginUserRes.ok) {
      alert('まだログインしていないようです。\n一度ログインしてから再度お試し下さい')
      chrome.tabs.create({ url: `https://ssl.wf.jobcan.jp/#` });
      return;
    }
    const loginUserData = await loginUserRes.json();
    const primaryGroupId = loginUserData.primary_group.id;

    const myHeaders = new Headers();
    myHeaders.append('x-jbcwf-user', JSON.stringify({ primary_group_id: primaryGroupId }));

    // 各 API エンドポイントの URL を順に試す (1.承認対象の申請、2.共有された申請、3.閲覧できる申請、4.自分の申請)
    const endpoints = [
      {
        url: `https://ssl.wf.jobcan.jp/api/v1/myapprovals/?page=1&req_id=${ringiNumber}&req_per_page=20&req_status=9&show_cancel_request=true&sort_key=updated_at__desc`,
        errorMessage: 'error myapprovals',
        endpointDescription: 'myapprovals:【承認する】から申請を検索するためのAPI',
        sampleRingiNumber: 'HD-TRA-1147'
      },
      {
        url: `https://ssl.wf.jobcan.jp/api/v1/requests/circulation/?page=1&req_id=${ringiNumber}&req_per_page=20&req_status=9&show_cancel_request=true&sort_key=request_date__desc`,
        errorMessage: 'error circulation',
        endpointDescription: 'circulation:【閲覧できる申請一覧】から検索するためのAPI',
        sampleRingiNumber: 'BMJOB-544'
      },
      {
        url: `https://ssl.wf.jobcan.jp/api/v1/requests/share/?page=1&req_id=${ringiNumber}&req_per_page=20&req_status=9&share_type=shared&show_cancel_request=true&sort_key=share_date__desc`,
        errorMessage: 'error share',
        endpointDescription: 'share:【共有された申請一覧】から検索するためのAPI',
        sampleRingiNumber: 'RBHSP-4003'
      },
      {
        url: `https://ssl.wf.jobcan.jp/api/v1/myrequests/?page=1&req_id=${ringiNumber}&req_per_page=20&req_status=9&show_cancel_request=true&sort_key=request_date__desc`,
        errorMessage: 'error myrequests',
        endpointDescription: 'myrequests:【自分の申請一覧】から検索するためのAPI',
        sampleRingiNumber: 'RBHSP-3964'
      }
    ];

    let detailUrl = null;
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint.url, { headers: myHeaders });
        if (!res.ok) {
          throw new Error(endpoint.errorMessage);
        }
        const data = await res.json();
        if (data.count > 0 && data.requests && data.requests.length > 0) {
          const cuid = data.requests[0].cuid; // 先頭のリクエストから cuid を取得
          detailUrl = `https://ssl.wf.jobcan.jp/#/requests/${cuid}`;
          break; // 該当する申請が見つかったらループ終了
        }
      } catch (error) {
        console.error(`Fetch error for endpoint ${endpoint.url}:`, error);
        // エラー発生時は次のエンドポイントへ進む
      }
    }

    if (detailUrl) {
      chrome.tabs.create({ url: detailUrl });
    } else {
      alert('番号に対応する稟議/申請が見つかりませんでした');
    }
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
    alert('通信エラーが発生しました');
  }
}