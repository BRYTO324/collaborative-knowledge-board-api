import { TagRepository } from './tag.repository';
import { CreateTagInput } from './tag.validator';
import { ConflictError } from '../../utils/errors';

export class TagService {
  private tagRepository: TagRepository;

  constructor() {
    this.tagRepository = new TagRepository();
  }

  async createTag(input: CreateTagInput) {
    const existing = await this.tagRepository.findByName(input.name);

    if (existing) {
      throw new ConflictError('Tag with this name already exists');
    }

    return this.tagRepository.create(input.name, input.color);
  }

  async getAllTags() {
    return this.tagRepository.findAll();
  }
}
