import { Grid } from '@arco-design/web-react';
import classnames from 'classnames';

const Row = Grid.Row;
const Col = Grid.Col;

export default ({
  label,
  content,
  className,
  colSpan = [10, 12],
  labelAlign = 'left',
}: {
  label: string;
  content?: string | React.ReactElement;
  className?: string;
  colSpan?: [number, number];
  labelAlign?: 'left' | 'right';
}) => {
  const gap = 24 - colSpan[1] - colSpan[0];

  return (
    <Row className={classnames('text-line', className)}>
      <Col
        span={colSpan[0]}
        className={'text-line__label'}
        style={{
          textAlign: labelAlign,
        }}
      >
        {label}:
      </Col>
      <Col span={colSpan[1]} offset={gap} className={'text-line__content'}>
        {content}
      </Col>
    </Row>
  );
};
