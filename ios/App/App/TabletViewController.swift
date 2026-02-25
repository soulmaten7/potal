import UIKit
import Capacitor
import WebKit

/// iPad에서 viewport를 1440px로 강제 잠금
/// Next.js가 setAttribute로 viewport를 바꾸는 것 자체를 가로채서 항상 width=1440 유지
class TabletViewController: CAPBridgeViewController {

    private var isTablet: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    private let viewportJS = """
    (function() {
        if (window.__POTAL_VP__) return;
        window.__POTAL_VP__ = true;

        var TARGET = 'width=1440';

        // 1) setAttribute를 가로채서 viewport 변경 차단
        var origSet = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function(n, v) {
            if (n === 'content' && this.tagName === 'META' && this.getAttribute('name') === 'viewport') {
                return origSet.call(this, n, TARGET);
            }
            return origSet.call(this, n, v);
        };

        // 2) .content 프로퍼티도 가로채기
        try {
            var desc = Object.getOwnPropertyDescriptor(HTMLMetaElement.prototype, 'content');
            Object.defineProperty(HTMLMetaElement.prototype, 'content', {
                set: function(v) {
                    if (this.getAttribute('name') === 'viewport') {
                        if (desc && desc.set) desc.set.call(this, TARGET);
                        else origSet.call(this, 'content', TARGET);
                    } else {
                        if (desc && desc.set) desc.set.call(this, v);
                        else origSet.call(this, 'content', v);
                    }
                },
                get: function() {
                    if (desc && desc.get) return desc.get.call(this);
                    return this.getAttribute('content');
                },
                configurable: true
            });
        } catch(e) {}

        // 3) 현재 viewport를 즉시 설정
        function forceVP() {
            var vp = document.querySelector('meta[name="viewport"]');
            if (vp) {
                origSet.call(vp, 'content', TARGET);
            } else if (document.head) {
                var m = document.createElement('meta');
                m.name = 'viewport';
                origSet.call(m, 'content', TARGET);
                document.head.appendChild(m);
            }
        }

        forceVP();
        document.addEventListener('DOMContentLoaded', forceVP);
        window.addEventListener('load', forceVP);
        setInterval(forceVP, 500);

        console.log('[POTAL] viewport locked to 1440');
    })();
    """

    override func viewDidLoad() {
        super.viewDidLoad()
        guard isTablet else { return }

        // WKUserScript: 이후 페이지 로드 시 document-start에 실행
        let script = WKUserScript(
            source: viewportJS,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        webView?.configuration.userContentController.addUserScript(script)

        // evaluateJavaScript: 현재 로딩 중인 초기 페이지에 직접 주입
        for delay in [0.5, 1.5, 3.0] {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                self?.webView?.evaluateJavaScript(self?.viewportJS ?? "")
            }
        }
    }
}
