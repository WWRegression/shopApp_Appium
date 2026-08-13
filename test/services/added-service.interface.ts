export interface AddedService {
  /**
   * Added Service를 선택하고 추가한다.
   */
  addService(): Promise<void>;

  /**
   * Added Service를 추가하지 않는 "No" 옵션을 선택한다.
   */
  selectNoForService(): Promise<void>;

  /**
   * 현재 추가된 Added Service를 제거한다.
   */
  removeService(): Promise<void>;

  /**
   * Added Service가 정상적으로 적용되었는지 검증한다.
   */
  verifyServiceApplied(): Promise<void>;

  /**
   * Added Service의 가격 또는 할인 금액을 조회한다.
   */
  getServicePrice(): Promise<number>;
}
