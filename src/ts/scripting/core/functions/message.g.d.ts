
/**
 * 提供消息提示的对象
 */
declare const message: {
  /**
   * 显示普通信息提示。
   * @param content 消息内容。
   * @param duration 可选参数，消息显示的持续时间（以秒为单位）。
   */
  info(content: string, duration?: number): void;

  /**
   * 显示成功信息提示。
   * @param content 消息内容。
   * @param duration 可选参数，消息显示的持续时间（以秒为单位）。
   */
  success(content: string, duration?: number): void;

  /**
   * 显示错误信息提示。
   * @param content 消息内容。
   * @param duration 可选参数，消息显示的持续时间（以秒为单位）。
   */
  error(content: string, duration?: number): void;

  /**
   * 显示警告信息提示。
   * @param content 消息内容。
   * @param duration 可选参数，消息显示的持续时间（以秒为单位）。
   */
  warning(content: string, duration?: number): void;
};



/**
 * 显示一个带有确认和取消按钮的对话框，让用户确认操作。
 *
 * @param props 对话框的属性，可以设置消息内容和标题（可选）
 * @returns 返回一个Promise，当用户点击确认按钮时，Promise会resolve为true，当用户点击取消按钮时，Promise会reject。
 */
declare function confirm(props: {
  content: string;
  title?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}): Promise<boolean>;