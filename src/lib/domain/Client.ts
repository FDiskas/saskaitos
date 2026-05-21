import { ClientId } from './ClientId';

export interface ClientProps {
  id: ClientId;
  name: string;
  code?: string;
  vatCode?: string;
  address: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ClientPatch = Partial<Omit<ClientProps, 'id' | 'createdAt'>>;

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class Client {
  private readonly props: ClientProps;

  private constructor(props: ClientProps) {
    this.props = props;
  }

  static of(props: ClientProps): Client {
    return new Client({ ...props });
  }

  get id(): ClientId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string | undefined {
    return this.props.code;
  }

  get vatCode(): string | undefined {
    return this.props.vatCode;
  }

  get address(): string {
    return this.props.address;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get contactPerson(): string | undefined {
    return this.props.contactPerson;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  slug(): string {
    return slugify(this.props.name);
  }

  withPatch(patch: ClientPatch): Client {
    return Client.of({ ...this.props, ...patch, updatedAt: new Date() });
  }
}
