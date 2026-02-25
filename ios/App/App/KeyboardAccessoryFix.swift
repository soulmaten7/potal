import UIKit

// WKWebView의 폼 네비게이션 툴바 (화살표 + 체크) 숨기기
// WKContentView의 inputAccessoryView를 nil로 오버라이드
extension UIView {
    @objc func _swizzled_inputAccessoryView() -> UIView? {
        return nil
    }
}

class KeyboardAccessoryFix {
    static func apply() {
        guard let targetClass = NSClassFromString("WKContentView") else { return }

        let originalSelector = #selector(getter: UIResponder.inputAccessoryView)
        let swizzledSelector = #selector(UIView._swizzled_inputAccessoryView)

        guard let originalMethod = class_getInstanceMethod(targetClass, originalSelector),
              let swizzledMethod = class_getInstanceMethod(UIView.self, swizzledSelector) else { return }

        method_exchangeImplementations(originalMethod, swizzledMethod)
    }
}
