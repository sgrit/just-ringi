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

// いつかこの階層の深いコードを誰か綺麗にしてください。
function handleSubmit() {
	const ringiNumber = document.getElementById('ringi-number').value;
	if (ringiNumber) {
		// ユーザの情報取得 閲覧可能な稟議と共有された稟議ではx-jbcwf-userヘッダーでprimary_group_idが必要なので。
		const apiUrl_login_user = `https://ssl.wf.jobcan.jp/api/v1/login_user/`;
		let primary_group;
		fetch(apiUrl_login_user)
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				primary_group = data.primary_group.id;
				//alert('primary_group= ' + primary_group );
				const myHeaders = new Headers();
				myHeaders.append("x-jbcwf-user", `{"primary_group_id":${primary_group}}`);

				// "承認する"に分類される申請
				const apiUrl_myapprovals =
					`https://ssl.wf.jobcan.jp/api/v1/myapprovals/?page=1&req_id=${ringiNumber}&req_per_page=20&req_status=9&show_cancel_request=true&sort_key=updated_at__desc`;
				fetch(apiUrl_myapprovals, {
						headers: myHeaders
					})
					.then(response => {
						if (!response.ok) {
							throw new Error('Network response was not ok');
						}
						return response.json();
					})
					.then(data => {
						if (data.count > 0 && data.requests && data.requests.length > 0) {
							const cuid = data.requests[0].cuid; // 最初のリクエストのcuidを取得

							// 明細ページのURLを作成
							const detailUrl = `https://ssl.wf.jobcan.jp/#/requests/${cuid}`;
							chrome.tabs.create({
								url: detailUrl
							});
						} else {
							// "閲覧できる"に分類される申請
							const apiUrl_circulation =
								`https://ssl.wf.jobcan.jp/api/v1/requests/circulation/?page=1&req_id=${ringiNumber}&req_per_page=20&req_status=9&show_cancel_request=true&sort_key=request_date__desc`;
							fetch(apiUrl_circulation, {
									headers: myHeaders
								})
								.then(response => {
									if (!response.ok) {
										// alert(JSON.stringify(response));
										throw new Error('Network response was not ok');
									}
									return response.json();
								})
								.then(data => {
									if (data.count > 0 && data.requests && data.requests.length > 0) {
										const cuid = data.requests[0].cuid; // 最初のリクエストのcuidを取得

										// 明細ページのURLを作成
										const detailUrl = `https://ssl.wf.jobcan.jp/#/requests/${cuid}`;
										chrome.tabs.create({
											url: detailUrl
										});
									} else {
										// "共有された"に分類される申請
										const apiUrl_share =
											`https://ssl.wf.jobcan.jp/api/v1/requests/share/?page=1&req_id=${ringiNumber}&req_per_page=20&req_status=9&share_type=shared&show_cancel_request=true&sort_key=share_date__desc`;
										fetch(apiUrl_share, {
												headers: myHeaders
											})
											.then(response => {
												if (!response.ok) {
													throw new Error('Network response was not ok');
												}
												return response.json();
											})
											.then(data => {
												if (data.count > 0 && data.requests && data.requests.length > 0) {
													const cuid = data.requests[0].cuid; // 最初のリクエストのcuidを取得

													// 明細ページのURLを作成
													const detailUrl = `https://ssl.wf.jobcan.jp/#/requests/${cuid}`;
													chrome.tabs.create({
														url: detailUrl
													});
												} else {
													// "自分の申請"に分類される申請
													const apiUrl_myrequests =
														`https://ssl.wf.jobcan.jp/api/v1/myrequests/?page=1&req_id=${ringiNumber}&req_per_page=20&req_status=9&show_cancel_request=true&sort_key=request_date__desc`;
													fetch(apiUrl_myrequests, {
															headers: myHeaders
														})
														.then(response => {
															if (!response.ok) {
																throw new Error('Network response was not ok');
															}
															return response.json();
														})
														.then(data => {
															if (data.count > 0 && data.requests && data.requests.length >
																0) {
																const cuid = data.requests[0].cuid; // 最初のリクエストのcuidを取得
																// 明細ページのURLを作成
																const detailUrl = `https://ssl.wf.jobcan.jp/#/requests/${cuid}`;
																chrome.tabs.create({
																	url: detailUrl
																});
															} else {
																alert('番号に対応する稟議/申請が見つかりませんでした');
															}
														})
														.catch(error => {
															console.error('There has been a problem with your fetch operation:', error);
															alert('error share');
														});
												}
											})
											.catch(error => {
												console.error('There has been a problem with your fetch operation:', error);
												alert('error share');
											});
									}
								})
								.catch(error => {
									console.error('There has been a problem with your fetch operation:', error);
									alert('error circulation');
								});
						}
					})
					.catch(error => {
						console.error('There has been a problem with your fetch operation:',
							error);
						alert('error myapprovals');
					});
			})
			.catch(error => {
				console.error('There has been a problem with your fetch operation:',
					error);
				alert('error login_user');
			});

	} else {
		alert('稟議番号/申請IDを入力してください');
	}
}
