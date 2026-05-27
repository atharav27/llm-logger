import { BadRequestException } from '@nestjs/common';
import { Provider } from '@prisma/client';

import {
  buildCatalogResponse,
  isAllowedModel,
  resolveMessageProviderModel,
  resolveProviderModel,
} from './llm-catalog';

describe('llm-catalog', () => {
  it('buildCatalogResponse includes GEMINI, GROQ, and OPENROUTER', () => {
    const catalog = buildCatalogResponse();

    expect(catalog.defaultProvider).toBe(Provider.GROQ);
    expect(catalog.defaultModel).toBe('llama-3.3-70b-versatile');
    expect(catalog.providers).toHaveLength(3);
    expect(catalog.providers.map((p) => p.id)).toEqual(
      expect.arrayContaining([
        Provider.GEMINI,
        Provider.GROQ,
        Provider.OPENROUTER,
      ]),
    );
  });

  it('isAllowedModel validates allowlist', () => {
    expect(isAllowedModel(Provider.GEMINI, 'gemini-2.0-flash')).toBe(true);
    expect(isAllowedModel(Provider.GROQ, 'openai/gpt-oss-120b')).toBe(true);
    expect(
      isAllowedModel(Provider.OPENROUTER, 'deepseek/deepseek-v4-flash:free'),
    ).toBe(true);
    expect(isAllowedModel(Provider.GROQ, 'gpt-4o')).toBe(false);
    expect(isAllowedModel(Provider.GROQ, 'deepseek-r1-distill-llama-70b')).toBe(
      false,
    );
  });

  it('resolveProviderModel applies defaults', () => {
    const result = resolveProviderModel();

    expect(result.provider).toBe(Provider.GROQ);
    expect(result.model).toBe('llama-3.3-70b-versatile');
  });

  it('resolveProviderModel rejects invalid pairs', () => {
    expect(() =>
      resolveProviderModel(Provider.GROQ, 'gemini-2.0-flash'),
    ).toThrow(BadRequestException);
  });

  it('resolveMessageProviderModel requires both body fields', () => {
    expect(() =>
      resolveMessageProviderModel(
        Provider.GEMINI,
        'gemini-2.0-flash',
        Provider.GROQ,
        undefined,
      ),
    ).toThrow(BadRequestException);
  });

  it('resolveMessageProviderModel uses conversation when body omitted', () => {
    const result = resolveMessageProviderModel(
      Provider.GROQ,
      'llama-3.3-70b-versatile',
    );

    expect(result.provider).toBe(Provider.GROQ);
    expect(result.model).toBe('llama-3.3-70b-versatile');
  });
});
