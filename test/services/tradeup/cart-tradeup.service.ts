import { CartLocator } from "../../locators/cart.locator";
import { AddedService } from "../added-service.interface";
import { assertElementDisplayed } from "../../helpers/validation.helper";
import { parsePriceToNumber } from "../../helpers/data.helper";
import { clickIfDisplayed, isDisplayedOrFalse, scrollAndJsClick, scrollAndWdioClick, setInputValue } from "../../helpers/element.helper";
import { scrollElementToCenter } from "../../helpers/gesture.helper";
import { switchToWebView } from "../../helpers/context.helper";

const WAIT_MS = 10000;
const STEP_LEAVE_MS = 8000;
const MAX_STEPS = 5;
/** Postcode check is a server round-trip with no fixed duration. */
const VALIDATE_MS = 30000;

/** Only the current step component is mounted. */
type CartTradeUpStep = "selectDevice" | "checkCondition" | "applyDiscount";
type PanelKind = "ready" | "pending" | "answered";

export class CartTradeUpService implements AddedService {
  private readonly locator = new CartLocator();

  async addService(postalCode?: string): Promise<void> {
    if (!(await clickIfDisplayed(this.locator.tradeUpAddButton, WAIT_MS))) {
      throw new Error("[Cart.TRADEUP.addService] trade-up add button not clickable");
    }
    console.warn("[Cart.TRADEUP.addService] trade-up add button clicked");
    await this.popupProcess(postalCode);
  }

  async selectNoForService(): Promise<void> {
  }

  async removeService(): Promise<void> {
    await this.locator.tradeUpRemoveButton.click();
  }

  async verifyServiceApplied(): Promise<void> {
    try {
      await assertElementDisplayed(this.locator.tradeUpRemoveButton, "Trade-Up not applied in cart");
    } catch (err) {
      console.warn("[Cart.TRADEUP.verifyServiceApplied] FAIL: Trade-Up not found in cart");
      throw err;
    }
    const price = ((await this.locator.tradeUpPriceLabel.getText().catch(() => "")) ?? "").trim();
    console.warn(`[Cart.TRADEUP.verifyServiceApplied] PASS: Trade-Up found in cart, price="${price || "-"}"`);
  }

  async getServicePrice(): Promise<number> {
    await switchToWebView();
    const text = (await this.locator.tradeUpPriceLabel.getText().catch(() => "")) ?? "";
    return parsePriceToNumber(text);
  }

  private async popupProcess(postalCode?: string): Promise<void> {
    if (!(await this.waitForOpen())) {
      throw new Error("[Cart.TRADEUP] popup did not open");
    }
    console.warn("[Cart.TRADEUP] popup opened");

    let previous: CartTradeUpStep | null = null;
    let retried = false;
    for (let attempt = 1; attempt <= MAX_STEPS; attempt++) {
      let active: CartTradeUpStep | null = null;
      await driver
        .waitUntil(async () => {
          active = await this.currentActiveStep();
          return active !== null || !(await this.isPopupOpen());
        }, { timeout: WAIT_MS, interval: 300 })
        .catch(() => undefined);
      if (!active) {
        if (!(await this.isPopupOpen())) {
          console.warn("[Cart.TRADEUP] popup closed");
          return;
        }
        throw new Error("[Cart.TRADEUP] popup open but no step shown");
      }
      if (active === previous && retried) {
        throw new Error(`[Cart.TRADEUP] stuck on step "${active}"`);
      }
      retried = active === previous;
      previous = active;
      console.warn(`[Cart.TRADEUP] step ${attempt}: ${active}${retried ? " (retry)" : ""}`);
      await this.runStep(active, postalCode);
      if (!(await this.waitForStepLeave(active))) {
        console.warn(`[Cart.TRADEUP] step "${active}" still shown after ${STEP_LEAVE_MS}ms`);
      }
    }
    if (await this.isPopupOpen()) {
      throw new Error(`[Cart.TRADEUP] popup still open after ${MAX_STEPS} steps`);
    }
  }

  private async runStep(step: CartTradeUpStep, postalCode?: string): Promise<void> {
    switch (step) {
      case "selectDevice":
        await this.fillPostalCode(postalCode);
        await this.selectDeviceOptions();
        break;
      case "checkCondition":
        if (await clickIfDisplayed(this.locator.tradeUpConditionYes)) {
          console.warn("[Cart.TRADEUP] condition yes clicked");
          break;
        }
        await this.selectConditionAnswers();
        break;
      case "applyDiscount":
        await this.checkAllTerms();
        break;
    }
    await this.selectContinueButton();
  }

  /** First enabled radio in each unanswered group. Checkbox groups are optional defects and are left alone. */
  private async selectConditionAnswers(): Promise<void> {
    for (let pass = 1; pass <= 30; pass++) {
      const answer = await this.nextConditionAnswer(pass === 1 ? 0 : WAIT_MS);
      if (!answer) {
        break;
      }
      const label = ((await answer.getText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
      await scrollAndWdioClick(answer);
      console.warn(`[Cart.TRADEUP] condition ${pass}: "${label || "-"}"`);
    }
  }

  private async nextConditionAnswer(timeout: number): Promise<WebdriverIO.Element | undefined> {
    const scan = async (): Promise<{ answer?: WebdriverIO.Element; pending: boolean }> => {
      let pending = false;
      for (const group of await this.locator.tradeUpConditionGroups.getElements()) {
        const radios = await group.$$("input[type='radio']").getElements();
        if (radios.length === 0) {
          continue;
        }
        let answered = false;
        let enabled: WebdriverIO.Element | undefined;
        for (const radio of radios) {
          if (await radio.isSelected().catch(() => false)) {
            answered = true;
          }
          if (!enabled && (await radio.getAttribute("disabled").catch(() => null)) === null) {
            enabled = radio;
          }
        }
        if (answered) {
          continue;
        }
        if (!enabled) {
          pending = true;
          continue;
        }
        const id = (await enabled.getAttribute("id").catch(() => "")) ?? "";
        return { answer: id ? group.$(`label[for="${id}"]`) : group.$("label.condition-radio__button:not(.disabled)"), pending: true };
      }
      return { pending };
    };

    const first = await scan();
    if (first.answer || !first.pending) {
      return first.answer;
    }
    let found: WebdriverIO.Element | undefined;
    await driver
      .waitUntil(async () => Boolean((found = (await scan()).answer)), { timeout: timeout || WAIT_MS, interval: 300 })
      .catch(() => undefined);
    return found;
  }

  private async checkAllTerms(): Promise<void> {
    const checkboxes = this.locator.tradeUpTermsCheckboxes;
    await driver
      .waitUntil(async () => (await checkboxes.getElements()).length > 0, { timeout: WAIT_MS, interval: 300 })
      .catch(() => undefined);
    for (const checkbox of await checkboxes.getElements()) {
      if (await checkbox.isSelected().catch(() => false)) {
        console.warn("[Cart.TRADEUP] terms already checked");
        continue;
      }
      await scrollAndJsClick(checkbox);
      console.warn("[Cart.TRADEUP] terms checkbox clicked");
    }
  }

  /** Footer sits under the terms. Scroll first so a pre-checked box still reveals the button. */
  private async selectContinueButton(): Promise<void> {
    await scrollElementToCenter(this.locator.tradeUpModal.$(this.locator.tradeUpFooterAction));
    if (!(await clickIfDisplayed(this.locator.tradeUpContinueButton, WAIT_MS))) {
      throw new Error("[Cart.TRADEUP] continue button not clickable");
    }
    console.warn("[Cart.TRADEUP] continue clicked");
  }

  /** Live DOM read. isDisplayed stays true on a closed modal and is slow after the cart refreshes. */
  private async isPopupOpen(): Promise<boolean> {
    return driver.execute((popup) => {
      const root = document.querySelector(popup as string);
      if (!(root instanceof HTMLElement)) {
        return false;
      }
      const style = getComputedStyle(root);
      return style.display !== "none" && style.visibility !== "hidden" && root.getClientRects().length > 0;
    }, this.locator.tradeUpPopup).catch(() => false);
  }

  private async waitForOpen(timeout = WAIT_MS): Promise<boolean> {
    return driver.waitUntil(() => this.isPopupOpen(), { timeout, interval: 300 }).then(() => true).catch(() => false);
  }

  /** The mounted step. Tag prefix covers global, IN, UK, and CN (`app-step-one-cn`). */
  private async currentActiveStep(): Promise<CartTradeUpStep | null> {
    const found = await driver.execute((popup) => {
      const root = document.querySelector(popup as string);
      if (!(root instanceof HTMLElement)) {
        return "";
      }
      const style = getComputedStyle(root);
      if (style.display === "none" || style.visibility === "hidden" || root.getClientRects().length === 0) {
        return "";
      }
      const modal = root.querySelector(".trade-up-modal, .trade-in-modal");
      let node = modal?.parentElement ?? null;
      while (node && node !== root) {
        const tag = node.tagName.toLowerCase();
        if (tag.startsWith("app-step-one")) return "selectDevice";
        if (tag.startsWith("app-step-two")) return "checkCondition";
        if (tag.startsWith("app-step-three")) return "applyDiscount";
        node = node.parentElement;
      }
      return "";
    }, this.locator.tradeUpPopup).catch(() => "");
    if (found === "selectDevice" || found === "checkCondition" || found === "applyDiscount") {
      return found;
    }
    return null;
  }

  /** False when the same step is still shown after the timeout. */
  private async waitForStepLeave(step: CartTradeUpStep): Promise<boolean> {
    return driver
      .waitUntil(async () => !(await this.isPopupOpen()) || (await this.currentActiveStep()) !== step, {
        timeout: STEP_LEAVE_MS,
        interval: 300,
      })
      .then(() => true)
      .catch(() => false);
  }

  private async fillPostalCode(postalCode?: string): Promise<void> {
    const input = this.locator.tradeUpPostalInput;
    if (!(await isDisplayedOrFalse(input))) {
      return;
    }
    if (await isDisplayedOrFalse(this.locator.tradeUpPostalSuccess)) {
      console.warn("[Cart.TRADEUP] postal code already accepted");
      return;
    }
    if (!postalCode) {
      throw new Error("[Cart.TRADEUP] postal code shown but site data has no tradeUp.postalCode");
    }
    await setInputValue(input, postalCode);
    console.warn(`[Cart.TRADEUP] postal code entered: ${postalCode}`);

    const check = this.locator.tradeUpPostalCheckButton;
    if (!(await isDisplayedOrFalse(check))) {
      return;
    }
    if (!(await clickIfDisplayed(check))) {
      throw new Error("[Cart.TRADEUP] postal code check button not clickable");
    }
    console.warn("[Cart.TRADEUP] postal code check clicked");

    let error = "";
    const accepted = await driver
      .waitUntil(async () => {
        if (await isDisplayedOrFalse(this.locator.tradeUpPostalSuccess)) {
          return true;
        }
        if (!(await isDisplayedOrFalse(check)) || (await check.getAttribute("disabled").catch(() => null)) !== null) {
          return true;
        }
        const errorEl = this.locator.tradeUpPostalError;
        if (await isDisplayedOrFalse(errorEl)) {
          error = ((await errorEl.getText().catch(() => "")) ?? "").trim() || "error shown";
          return true;
        }
        return false;
      }, { timeout: VALIDATE_MS, interval: 500 })
      .catch(() => false);
    if (error) {
      throw new Error(`[Cart.TRADEUP] postal code rejected: "${error}"`);
    }
    if (!accepted) {
      throw new Error(`[Cart.TRADEUP] postal code not accepted within ${VALIDATE_MS}ms`);
    }
    console.warn("[Cart.TRADEUP] postal code accepted");
  }

  /** Re-read each pass. The next list is filled only after the previous pick. */
  private async selectDeviceOptions(): Promise<void> {
    const picked: string[] = [];
    for (let pass = 1; pass <= 8; pass++) {
      const panel = await this.nextOpenDropdown(pass === 1 ? 0 : WAIT_MS);
      if (panel) {
        const label = await this.chooseFirstOption(panel);
        console.warn(`[Cart.TRADEUP.selectDeviceOptions] dropdown ${pass}: "${label || "-"}"`);
        continue;
      }
      const option = await this.nextProductOption(picked, pass === 1 ? 0 : WAIT_MS);
      if (option) {
        const label = ((await option.$(".sc-select-b-c").getText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
        await scrollAndWdioClick(option);
        if (label) {
          picked.push(label);
        }
        console.warn(`[Cart.TRADEUP.selectDeviceOptions] product ${pass}: "${label || "-"}"`);
        continue;
      }
      const select = await this.nextMatSelect(pass === 1 ? 0 : WAIT_MS);
      if (!select) {
        break;
      }
      const label = await this.chooseFirstMatOption(select);
      console.warn(`[Cart.TRADEUP.selectDeviceOptions] select ${pass}: "${label || "-"}"`);
    }
  }

  /** First enabled empty mat-select. A disabled empty one is waiting for the previous pick. */
  private async nextMatSelect(timeout: number): Promise<WebdriverIO.Element | undefined> {
    const scan = async (): Promise<{ select?: WebdriverIO.Element; pending: boolean }> => {
      let pending = false;
      for (const select of await this.locator.tradeUpMatSelects.getElements()) {
        const kind = await this.matSelectKind(select);
        if (kind === "ready") {
          return { select, pending: true };
        }
        pending ||= kind === "pending";
      }
      return { pending };
    };

    const first = await scan();
    if (first.select || !first.pending) {
      return first.select;
    }
    let found: WebdriverIO.Element | undefined;
    await driver
      .waitUntil(async () => Boolean((found = (await scan()).select)), { timeout: timeout || WAIT_MS, interval: 300 })
      .catch(() => undefined);
    return found;
  }

  private async matSelectKind(select: WebdriverIO.Element): Promise<PanelKind> {
    return driver.execute((el) => {
      const root = el as HTMLElement;
      const disabled = root.getAttribute("aria-disabled") === "true" || root.classList.contains("mat-mdc-select-disabled");
      if (!root.classList.contains("mat-mdc-select-empty")) {
        return "answered";
      }
      return disabled ? "pending" : "ready";
    }, select).catch(() => "answered" as const);
  }

  private async chooseFirstMatOption(select: WebdriverIO.Element): Promise<string> {
    await scrollAndWdioClick(select.$(".mat-mdc-select-trigger"));
    let option: WebdriverIO.Element | undefined;
    const opened = await driver
      .waitUntil(async () => {
        for (const item of await this.locator.tradeUpMatOptions.getElements()) {
          if (await isDisplayedOrFalse(item)) {
            option = item;
            return true;
          }
        }
        return false;
      }, { timeout: WAIT_MS, interval: 300 })
      .catch(() => false);
    if (!opened || !option) {
      throw new Error("[Cart.TRADEUP] mat-select option not shown");
    }
    const label = ((await option.getText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    await scrollAndWdioClick(option);
    await driver.waitUntil(async () => {
      const className = (await select.getAttribute("class").catch(() => "")) ?? "";
      return !className.includes("mat-mdc-select-empty");
    }, { timeout: WAIT_MS, interval: 300 }).catch(() => undefined);
    return label;
  }

  /** First IN tile list that is shown and not already picked. A new list can appear after the click. */
  private async nextProductOption(picked: string[], timeout: number): Promise<WebdriverIO.Element | undefined> {
    const scan = async (): Promise<{ option?: WebdriverIO.Element; pending: boolean }> => {
      let pending = false;
      for (const group of await this.locator.tradeUpProductGroups.getElements()) {
        const options = await group.$$("li").getElements();
        if (options.length === 0) {
          pending = true;
          continue;
        }
        const labels = [];
        for (const option of options) {
          labels.push(((await option.$(".sc-select-b-c").getText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim());
        }
        if (labels.some((label) => picked.includes(label))) {
          continue;
        }
        return { option: options[0], pending: true };
      }
      if (!pending && (await this.locator.tradeUpProductGroups.getElements()).length === 0) {
        pending = await isDisplayedOrFalse(this.locator.tradeUpModal.$(".sc-e-pmp-c-cont"));
      }
      return { pending };
    };

    const first = await scan();
    if (first.option || (!first.pending && picked.length === 0)) {
      return first.option;
    }
    let found: WebdriverIO.Element | undefined;
    await driver
      .waitUntil(async () => {
        found = (await scan()).option;
        return Boolean(found) || (await isDisplayedOrFalse(this.locator.tradeUpContinueButton));
      }, { timeout: timeout || WAIT_MS, interval: 300 })
      .catch(() => undefined);
    return found;
  }

  /** pointer-events: none and an inert list ignore HTMLElement.click(), so use a pointer click. */
  private async chooseFirstOption(panel: WebdriverIO.Element): Promise<string> {
    const header = panel.$("mat-expansion-panel-header");
    await driver.execute((el) => {
      const node = (el as HTMLElement).querySelector("mat-expansion-panel-header");
      if (node instanceof HTMLElement) {
        node.style.pointerEvents = "auto";
      }
    }, panel).catch(() => undefined);
    if ((await header.getAttribute("aria-expanded").catch(() => "")) !== "true") {
      await scrollAndWdioClick(header);
      const opened = await driver
        .waitUntil(async () => (await header.getAttribute("aria-expanded").catch(() => "")) === "true", { timeout: WAIT_MS, interval: 200 })
        .then(() => true)
        .catch(() => false);
      console.warn(`[Cart.TRADEUP.chooseFirstOption] panel opened=${opened}`);
    }
    const option = panel.$("li.trade-up__dropdown-option");
    await option.waitForDisplayed({ timeout: WAIT_MS });
    const label = ((await option.$(".option-brand").getText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    await scrollAndWdioClick(option);
    if (label) {
      await driver.waitUntil(async () => {
        const title = ((await panel.$("mat-panel-title").getText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
        return title.includes(label);
      }, { timeout: WAIT_MS, interval: 300 }).catch(() => undefined);
    }
    return label;
  }

  /** First panel that has options and still shows a placeholder. Answered panels end the search. */
  private async nextOpenDropdown(timeout: number): Promise<WebdriverIO.Element | undefined> {
    const scan = async (): Promise<{ panel?: WebdriverIO.Element; pending: boolean }> => {
      let pending = false;
      for (const panel of await this.locator.tradeUpDropdowns.getElements()) {
        const kind = await this.panelKind(panel);
        if (kind === "ready") {
          return { panel, pending: true };
        }
        pending ||= kind === "pending";
      }
      return { pending };
    };

    const first = await scan();
    if (first.panel || !first.pending) {
      return first.panel;
    }
    let found: WebdriverIO.Element | undefined;
    await driver
      .waitUntil(async () => Boolean((found = (await scan()).panel)), { timeout: timeout || WAIT_MS, interval: 300 })
      .catch(() => undefined);
    return found;
  }

  private async panelKind(panel: WebdriverIO.Element): Promise<PanelKind> {
    return driver.execute((el) => {
      const root = el as HTMLElement;
      const title = (root.querySelector("mat-panel-title")?.textContent ?? "").replace(/\s+/g, " ").trim();
      const options = [...root.querySelectorAll("li.trade-up__dropdown-option .option-brand")]
        .map((node) => (node.textContent ?? "").replace(/\s+/g, " ").trim())
        .filter(Boolean);
      if (options.some((option) => title.includes(option))) {
        return "answered";
      }
      return options.length > 0 ? "ready" : "pending";
    }, panel).catch(() => "answered" as const);
  }
}
